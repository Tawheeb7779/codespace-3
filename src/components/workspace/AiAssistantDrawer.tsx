import React, { useRef, useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  X,
  Code2,
  Wrench,
  Lock,
  AlertTriangle,
  Mic,
  MicOff,
  StopCircle
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { usePreferenceStore } from '../../store/usePreferenceStore';
import { VoiceRecognitionService } from '../../services/VoiceRecognitionService';
import { useRuntimeStore } from '../../runtime/RuntimeManager';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isError?: boolean;
}

/** Thrown for a non-ok HTTP response so callers can branch on status (e.g. 429). */
class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 30_000;

/** First fenced code block in a reply, or null when the reply has none. */
function extractCodeBlock(text: string): string | null {
  const match = text.match(/```[a-zA-Z0-9+-]*\n([\s\S]*?)```/);
  return match ? match[1].replace(/\n$/, '') : null;
}

interface AiAssistantDrawerProps {
  /** Rendered inside the workspace's right dock rather than as a floating drawer. */
  docked?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({ isOpen, onClose, docked = false }) => {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const activeFileId = useProjectStore((s) => s.activeFileId);
  const updateFileContent = useProjectStore((s) => s.updateFileContent);
  const saveFile = useProjectStore((s) => s.saveFile);
  const buildProject = useRuntimeStore((s) => s.buildProject);
  const { aiProvider, aiApiKey } = usePreferenceStore();

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Configure an OpenAI or Anthropic API key in Dashboard > Settings to use the assistant. Your active file is sent as context with each request.',
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentProject = projects.find((p) => p.id === activeProjectId);
  const activeFile = activeFileId && currentProject ? currentProject.files[activeFileId] : null;

  const handleToggleVoice = () => {
    if (isListening) {
      VoiceRecognitionService.stopListening();
      setIsListening(false);
    } else {
      const started = VoiceRecognitionService.startListening({
        onResult: (transcript) => setInput(transcript),
        onError: () => setIsListening(false),
        onEnd: () => setIsListening(false),
      });
      if (started) setIsListening(true);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userText = input.trim();
    const key = (aiApiKey || '').trim();

    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'user', text: userText }]);
    setInput('');

    // No provider configured: say so instead of answering with a canned script.
    if (aiProvider === 'none' || !key) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          sender: 'assistant',
          isError: true,
          text:
            aiProvider === 'none'
              ? 'No AI provider is configured. Choose OpenAI or Anthropic in Dashboard > Settings and enter an API key. There is no built-in model.'
              : `No API key is set for ${aiProvider}. Add one in Dashboard > Settings.`,
        },
      ]);
      return;
    }

    setIsThinking(true);

    const context = [
      `Project: ${currentProject?.name ?? 'unknown'}`,
      `Active file: ${activeFile?.path ?? 'none'}`,
      activeFile && !activeFile.isFolder
        ? `Active file contents:\n${activeFile.content.slice(0, 4000)}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const systemPrompt = `You are a coding assistant inside the CodeSpace 3D browser IDE.\n${context}`;

    // Cancel any still-pending request before starting a new one.
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      let replyText: string;

      if (aiProvider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userText },
            ],
          }),
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new ApiError(errJson.error?.message || `OpenAI API error ${res.status}`, res.status);
        }
        const data = await res.json();
        replyText = data.choices?.[0]?.message?.content || 'The provider returned an empty response.';
      } else {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            // Required for browser-originated calls to the Anthropic API.
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-latest',
            max_tokens: 1500,
            system: systemPrompt,
            messages: [{ role: 'user', content: userText }],
          }),
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new ApiError(errJson.error?.message || `Anthropic API error ${res.status}`, res.status);
        }
        const data = await res.json();
        replyText = data.content?.[0]?.text || 'The provider returned an empty response.';
      }

      setMessages((prev) => [
        ...prev,
        { id: `${Date.now() + 1}`, sender: 'assistant', text: replyText },
      ]);
    } catch (err: unknown) {
      let text: string;
      if (err instanceof DOMException && err.name === 'AbortError') {
        text = timedOut
          ? `The ${aiProvider} request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Try again or shorten the file context.`
          : 'Request cancelled.';
      } else if (err instanceof ApiError && err.status === 429) {
        text = `${aiProvider === 'openai' ? 'OpenAI' : 'Anthropic'} rate limit hit (429). Wait a moment before sending another request.`;
      } else {
        const message = err instanceof Error ? err.message : String(err);
        text = `The ${aiProvider} request failed: ${message}`;
      }
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now() + 1}`, sender: 'assistant', isError: true, text },
      ]);
    } finally {
      window.clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsThinking(false);
    }
  };

  const handleCancelRequest = (): void => {
    abortControllerRef.current?.abort();
  };

  /**
   * Runs the project's real `build` script in the WebContainer and reports the
   * actual exit code - not an in-browser approximation of a compile.
   */
  const handleRunBuild = async (): Promise<void> => {
    const project = useProjectStore.getState().getActiveProject();
    if (!project || isThinking) return;

    setIsThinking(true);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: 'Run a build check.' },
    ]);

    const result = await buildProject(project.id, project.files);
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now() + 1}`,
        sender: 'assistant',
        isError: !result.success,
        text: result.success
          ? `npm run build succeeded in ${result.durationMs}ms. Full output is in the Output panel.`
          : `npm run build did not succeed: ${result.error ?? `exit code ${result.exitCode}`}. See the Output panel.`,
      },
    ]);
    setIsThinking(false);
  };

  /** Applies the first fenced code block of a reply to the file open in the editor. */
  const applyCodeBlock = (code: string) => {
    if (!activeFileId) return;
    updateFileContent(activeFileId, code);
    saveFile(activeFileId);
  };

  if (!isOpen) return null;

  return (
    <div
      className={
        docked
          ? 'w-full h-full bg-surface-low flex flex-col min-h-0'
          : 'w-80 bg-surface-low border-l border-white/10 flex flex-col h-full z-40 shadow-2xl'
      }
    >
      {/* Header */}
      <div className="h-11 px-3 bg-surface-container border-b border-outline-variant/15 flex items-center justify-between">
        <div className="flex items-center gap-2 text-secondary font-semibold text-xs">
          <Bot className="w-4 h-4" />
          <span>AI ASSISTANT</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/15 text-secondary border border-secondary/30 font-mono uppercase">
            {aiProvider === 'none' ? 'not configured' : aiProvider}
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:text-white text-outline rounded hover:bg-surface-high">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Security Disclaimer */}
      <div className="p-2 bg-surface-high/50 border-b border-outline-variant/10 text-[10px] text-outline flex items-center gap-1.5 px-3">
        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
        <span>
          {aiProvider === 'none'
            ? 'No provider configured - set one in Dashboard > Settings. There is no built-in model.'
            : aiApiKey
              ? `Requests go from this browser directly to ${aiProvider}. Key held in memory only.`
              : `Provider ${aiProvider} selected, but no API key is set.`}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col gap-1 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-2.5 rounded-xl max-w-[90%] space-y-2 leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-primary-container text-white rounded-br-none'
                  : 'bg-surface-container text-slate-200 border border-outline-variant/15 rounded-bl-none'
              }`}
            >
              {m.isError && (
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                  <AlertTriangle className="w-3 h-3" /> Not answered
                </div>
              )}
              <p className="whitespace-pre-wrap">{m.text}</p>

              {m.sender === 'assistant' && !m.isError && extractCodeBlock(m.text) && activeFile && (
                <div className="pt-2 border-t border-white/10 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-tertiary">
                    <Sparkles className="w-3 h-3" />
                    <span>Code block detected</span>
                  </div>
                  <button
                    onClick={() => applyCodeBlock(extractCodeBlock(m.text) as string)}
                    className="w-full py-1 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-[10px] font-medium flex items-center justify-center gap-1 border border-emerald-500/30 transition-colors"
                  >
                    <Wrench className="w-3 h-3" />
                    Replace {activeFile.name} with this block
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 text-outline text-xs p-2">
            <Sparkles className="w-3.5 h-3.5 text-secondary animate-spin" />
            <span>Analyzing workspace context...</span>
            <button
              onClick={handleCancelRequest}
              className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-[10px] text-red-300 hover:text-red-200 hover:bg-red-500/10 border border-red-500/20"
            >
              <StopCircle className="w-3 h-3" /> Stop
            </button>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 border-t border-outline-variant/10 flex gap-1 overflow-x-auto text-[10px] text-outline">
        <button
          onClick={() => setInput('Create 3D component SpatialBox')}
          className="px-2 py-1 bg-surface-container hover:text-white rounded border border-outline-variant/15 whitespace-nowrap flex items-center gap-1"
        >
          <Code2 className="w-3 h-3 text-primary" /> Create 3D Component
        </button>
        <button
          onClick={handleRunBuild}
          disabled={isThinking}
          className="px-2 py-1 bg-surface-container hover:text-white rounded border border-outline-variant/15 whitespace-nowrap flex items-center gap-1 text-emerald-400 disabled:opacity-40"
        >
          <Sparkles className="w-3 h-3" /> Run Build Check
        </button>
        <button
          onClick={() => setInput('Refactor active file')}
          className="px-2 py-1 bg-surface-container hover:text-white rounded border border-outline-variant/15 whitespace-nowrap flex items-center gap-1"
        >
          <Wrench className="w-3 h-3 text-amber-400" /> Refactor Code
        </button>
      </div>

      {/* Input Form with Voice Dictation */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant/15 bg-surface-container-low flex gap-2 items-center">
        <button
          type="button"
          onClick={handleToggleVoice}
          className={`p-2 rounded-lg transition-colors ${
            isListening ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-surface-container text-outline hover:text-white'
          }`}
          title="Voice Speech Recognition"
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>
        <input
          type="text"
          placeholder="Ask AI to modify files or dictate prompt..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded-lg text-xs text-white placeholder-outline focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="p-2 bg-primary-container disabled:opacity-40 hover:bg-primary-container/80 text-white rounded-lg transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

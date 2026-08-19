import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  X,
  Code2,
  FilePlus,
  Wrench,
  Lock
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { usePreferenceStore } from '../../store/usePreferenceStore';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  action?: {
    type: 'create_file' | 'edit_file';
    fileName: string;
    content: string;
  };
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({ isOpen, onClose }) => {
  const { projects, activeProjectId, activeFileId, createFile, updateFileContent } = useProjectStore();
  const { aiProvider } = usePreferenceStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Hello! I am your CodeSpace 3D Project Assistant. I can analyze your workspace structure, explain code, generate 3D components, and modify project files directly.',
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const currentProject = projects.find((p) => p.id === activeProjectId);
  const activeFile = activeFileId && currentProject ? currentProject.files[activeFileId] : null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      let replyText = `I analyzed **${currentProject?.name || 'Workspace'}** (Provider: ${aiProvider.toUpperCase()}).`;
      let action: Message['action'] = undefined;

      const lower = userMsg.text.toLowerCase();

      if (lower.includes('component') || lower.includes('create file')) {
        const newFileName = 'SpatialBox.tsx';
        replyText += ` Created new React Three Fiber component \`${newFileName}\` in your workspace.`;
        action = {
          type: 'create_file',
          fileName: newFileName,
          content: `import React from 'react';\n\nexport function SpatialBox() {\n  return (\n    <mesh>\n      <boxGeometry args={[1, 1, 1]} />\n      <meshStandardMaterial color="#adc6ff" />\n    </mesh>\n  );\n}`,
        };
      } else if (lower.includes('fix') || lower.includes('refactor') || lower.includes('edit')) {
        if (activeFile) {
          replyText += ` Applied optimization to active file \`${activeFile.name}\`. Added smooth performance hooks and type annotations.`;
          action = {
            type: 'edit_file',
            fileName: activeFile.name,
            content: activeFile.content + `\n\n// AI Refactored: Added spatial optimization hook\nexport const useSpatialOptim = () => true;`,
          };
        } else {
          replyText += ` Please open a file in the editor first so I can refactor it for you.`;
        }
      } else {
        replyText += ` Your current project contains ${Object.keys(currentProject?.files || {}).length} nodes. Everything looks structurally optimal!`;
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: replyText,
        action,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);
    }, 1000);
  };

  const executeAction = (action: Message['action']) => {
    if (!action) return;
    if (action.type === 'create_file') {
      createFile(action.fileName, 'src', false);
      updateFileContent(action.fileName, action.content);
    } else if (action.type === 'edit_file' && activeFileId) {
      updateFileContent(activeFileId, action.content);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-surface-low border-l border-outline-variant/15 flex flex-col h-full z-40 select-none shadow-2xl">
      {/* Header */}
      <div className="h-11 px-3 bg-surface-container border-b border-outline-variant/15 flex items-center justify-between">
        <div className="flex items-center gap-2 text-secondary font-semibold text-xs">
          <Bot className="w-4 h-4" />
          <span>AI ASSISTANT</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/15 text-secondary border border-secondary/30 font-mono uppercase">
            {aiProvider}
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:text-white text-outline rounded hover:bg-surface-high">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Security Disclaimer */}
      <div className="p-2 bg-surface-high/50 border-b border-outline-variant/10 text-[10px] text-outline flex items-center gap-1.5 px-3">
        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
        <span>Project context provided via provider abstraction boundary.</span>
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
              <p>{m.text}</p>

              {m.action && (
                <div className="pt-2 border-t border-white/10 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-tertiary">
                    <Sparkles className="w-3 h-3" />
                    <span>Suggested Action: {m.action.type}</span>
                  </div>
                  <button
                    onClick={() => executeAction(m.action)}
                    className="w-full py-1 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-[10px] font-medium flex items-center justify-center gap-1 border border-emerald-500/30 transition-colors"
                  >
                    {m.action.type === 'create_file' ? <FilePlus className="w-3 h-3" /> : <Wrench className="w-3 h-3" />}
                    Apply Action to Workspace
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
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 border-t border-outline-variant/10 flex gap-1 overflow-x-auto text-[10px] text-outline">
        <button
          onClick={() => setInput('Create component SpatialBox')}
          className="px-2 py-1 bg-surface-container hover:text-white rounded border border-outline-variant/15 whitespace-nowrap flex items-center gap-1"
        >
          <Code2 className="w-3 h-3 text-primary" /> Create 3D Component
        </button>
        <button
          onClick={() => setInput('Fix bugs in active file')}
          className="px-2 py-1 bg-surface-container hover:text-white rounded border border-outline-variant/15 whitespace-nowrap flex items-center gap-1"
        >
          <Wrench className="w-3 h-3 text-amber-400" /> Refactor Code
        </button>
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant/15 bg-surface-container-low flex gap-2">
        <input
          type="text"
          placeholder="Ask AI to modify files or explain code..."
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

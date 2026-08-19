import React, { useState } from 'react';
import {
  MessageSquare,
  Hash,
  Send,
  Bot,
  User,
  Sparkles
} from 'lucide-react';
import { ChatMessage } from '../../types/stitch';
import { useProjectStore } from '../../store/useProjectStore';

export const TeamChatPanel: React.FC = () => {
  const { activeProjectId, projectChats, setChatForProject, createFile, updateFileContent } = useProjectStore();

  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState<'general' | 'dev-3d' | 'ai-nexus'>('general');

  const currentProjectId = activeProjectId || 'demo-3d-app';
  const messages = projectChats[currentProjectId] || [
    { id: '1', sender: 'Nexus AI [Offline Agent]', text: '3D Spatial Graph nodes compiled. 12 file nodes mounted to workspace.', timestamp: '10:14 AM', isAi: true }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, userMsg];
    setChatForProject(currentProjectId, updated);
    setInputText('');

    // Trigger AI response if in AI channel or tagged
    if (activeChannel === 'ai-nexus' || inputText.toLowerCase().includes('@ai')) {
      setTimeout(() => {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'Nexus AI [Offline Fallback Agent]',
          text: 'Context analyzed. Click below to generate a new R3F Spatial Shader mesh component directly on the workspace filesystem.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: true,
        };
        const withAi = [...updated, aiMsg];
        setChatForProject(currentProjectId, withAi);
      }, 800);
    }
  };

  const handleAiAction = () => {
    const fileName = 'ChannelShaderMesh.tsx';
    const content = `import React from 'react';

export function ChannelShaderMesh() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#38bdf8" wireframe />
    </mesh>
  );
}`;
    createFile(fileName, 'src', false);
    updateFileContent(fileName, content);
  };

  return (
    <div className="h-full flex flex-col bg-surface-low text-xs select-none border-r border-outline-variant/15 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
        <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" /> TEAM CHANNELS
        </span>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 text-[10px]">
          3 Online
        </span>
      </div>

      {/* Channel Switcher */}
      <div className="flex bg-surface-container p-0.5 rounded-lg border border-outline-variant/15 text-[11px]">
        <button
          onClick={() => setActiveChannel('general')}
          className={`flex-1 py-1 rounded font-medium transition-all flex items-center justify-center gap-1 ${
            activeChannel === 'general' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
          }`}
        >
          <Hash className="w-3 h-3" /> general
        </button>
        <button
          onClick={() => setActiveChannel('dev-3d')}
          className={`flex-1 py-1 rounded font-medium transition-all flex items-center justify-center gap-1 ${
            activeChannel === 'dev-3d' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
          }`}
        >
          <Hash className="w-3 h-3" /> dev-3d
        </button>
        <button
          onClick={() => setActiveChannel('ai-nexus')}
          className={`flex-1 py-1 rounded font-medium transition-all flex items-center justify-center gap-1 ${
            activeChannel === 'ai-nexus' ? 'bg-secondary text-slate-950 shadow' : 'text-outline hover:text-white'
          }`}
        >
          <Bot className="w-3 h-3" /> ai-nexus
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-3 p-1">
        {messages.map((m) => (
          <div key={m.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
                {m.isAi ? <Bot className="w-3.5 h-3.5 text-secondary" /> : <User className="w-3.5 h-3.5 text-primary" />}
                {m.sender}
              </span>
              <span className="text-[10px] text-outline">{m.timestamp}</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed bg-surface-container p-2.5 rounded-lg border border-outline-variant/10">
              {m.text}
            </p>
            {m.isAi && (
              <button
                onClick={handleAiAction}
                className="mt-1 py-1 px-2.5 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded text-[10px] font-medium flex items-center justify-center gap-1 border border-secondary/30 transition-colors"
              >
                <Sparkles className="w-3 h-3" /> Generate R3F Channel Mesh to Workspace File
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="pt-2 border-t border-outline-variant/15 flex gap-2">
        <input
          type="text"
          placeholder={`Message #${activeChannel}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded-lg text-xs text-white placeholder-outline focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-primary-container disabled:opacity-40 hover:bg-primary-container/80 text-white rounded-lg transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

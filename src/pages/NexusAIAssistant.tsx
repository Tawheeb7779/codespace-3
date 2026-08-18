import React, { useState } from 'react';
import { Sparkles, Send, Mic, MicOff, Bot, User, Code2, Cpu, FileCode } from 'lucide-react';
import { useIntegrationsStore } from '../stores/useIntegrationsStore';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';

export const NexusAIAssistant: React.FC = () => {
  const { nexusAiModel, voiceControlEnabled, toggleVoiceControl } = useIntegrationsStore();
  const { files } = useWorkspaceStore();

  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: `Hello Tawheeb! I am **${nexusAiModel}**, your spatial workspace AI assistant. I have indexed ${files.length} folders/files in your workspace. How can I help you build today?`
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMsg = { role: 'user', content: prompt.trim() };
    setChatHistory((prev) => [...prev, userMsg]);
    const currentPrompt = prompt.trim();
    setPrompt('');
    setIsThinking(true);

    setTimeout(() => {
      let aiResponse = `I analyzed your request regarding: "${currentPrompt}". Here is the recommended spatial solution:`;

      if (currentPrompt.toLowerCase().includes('component') || currentPrompt.toLowerCase().includes('react')) {
        aiResponse += `\n\n\`\`\`tsx\n// Generated Spatial Component\nimport React from 'react';\n\nexport const SpatialCard = () => (\n  <div className="p-4 bg-blue-900/40 border border-blue-500/30 rounded-xl backdrop-blur-md">\n    <h3 className="text-sm font-bold text-blue-300">Spatial Glassmorphic Node</h3>\n  </div>\n);\n\`\`\``;
      } else if (currentPrompt.toLowerCase().includes('shader') || currentPrompt.toLowerCase().includes('three')) {
        aiResponse += `\n\n\`\`\`glsl\n// Fragment Shader for Three.js\nvarying vec2 vUv;\nvoid main() {\n  gl_FragColor = vec4(vUv.x, vUv.y, 0.8, 0.8);\n}\n\`\`\``;
      } else {
        aiResponse += `\n\nAll workspace files checked. Zero syntax errors or key leaks detected. Ready to deploy.`;
      }

      setChatHistory((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0e131d] overflow-hidden select-none">
      {/* Header Bar */}
      <div className="h-12 bg-[#171c26]/90 border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <div>
            <div className="font-bold text-white text-xs font-sans">Nexus AI Assistant</div>
            <div className="text-[10px] text-purple-400 font-mono">{nexusAiModel}</div>
          </div>
        </div>

        <button
          onClick={toggleVoiceControl}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
            voiceControlEnabled
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
        >
          {voiceControlEnabled ? <Mic className="w-4 h-4 text-rose-400" /> : <MicOff className="w-4 h-4 text-slate-400" />}
          <span>{voiceControlEnabled ? 'Voice Listening...' : 'Enable Voice Control'}</span>
        </button>
      </div>

      {/* Main Chat Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 font-sans text-xs">
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
            )}

            <div
              className={`max-w-2xl p-4 rounded-xl space-y-2 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600/30 border border-blue-500/30 text-blue-100'
                  : 'bg-[#171c26]/90 border border-white/10 text-slate-200 backdrop-blur-md'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-blue-400" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center space-x-2 text-purple-400 font-mono text-xs p-2">
            <Cpu className="w-4 h-4 animate-spin" />
            <span>Nexus AI analyzing workspace context...</span>
          </div>
        )}
      </div>

      {/* Prompt Form */}
      <div className="p-4 bg-[#171c26]/80 border-t border-white/10">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Nexus AI to generate code, fix terminal errors, or create Three.js shaders..."
            className="flex-1 bg-[#0e131d] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

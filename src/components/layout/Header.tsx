import React from 'react';
import {
  Menu,
  Search,
  GitBranch,
  Mic,
  MicOff,
  Bell,
  Sparkles,
  Command,
  Cpu
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useIntegrationsStore } from '../../stores/useIntegrationsStore';

interface HeaderProps {
  onToggleMobile: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobile, onOpenSearch }) => {
  const { activeBranch } = useWorkspaceStore();
  const { voiceControlEnabled, toggleVoiceControl, githubUser } = useIntegrationsStore();

  return (
    <header className="h-12 border-b border-white/10 bg-[#171c26]/80 backdrop-blur-md flex items-center justify-between px-4 z-30 select-none">
      {/* Left section: Mobile menu toggle + Global Search trigger */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-1.5 rounded-md hover:bg-white/10 text-slate-300 transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-2 bg-[#0e131d]/80 border border-white/10 hover:border-blue-500/40 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg text-xs transition-all w-48 sm:w-64 justify-between"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search files, commands...</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1 text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-slate-300">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Center section: Active branch & Kernel status */}
      <div className="hidden md:flex items-center space-x-4 text-xs font-mono">
        <div className="flex items-center space-x-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full">
          <GitBranch className="w-3.5 h-3.5" />
          <span>{activeBranch}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>WASM Sandbox Kernel</span>
        </div>
      </div>

      {/* Right section: AI toggle, Voice assistant, Notifications, User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={toggleVoiceControl}
          className={`p-1.5 rounded-lg border transition-all text-xs flex items-center space-x-1.5 ${
            voiceControlEnabled
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
          }`}
          title={voiceControlEnabled ? 'Voice Assistant Active' : 'Enable Voice Assistant'}
        >
          {voiceControlEnabled ? <Mic className="w-4 h-4 text-rose-400" /> : <MicOff className="w-4 h-4" />}
          <span className="hidden sm:inline font-mono text-[11px]">{voiceControlEnabled ? 'Voice ON' : 'Voice'}</span>
        </button>

        <a
          href="/ai"
          className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/30 hover:border-blue-400 text-blue-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Nexus AI</span>
        </a>

        <div className="relative">
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#0e131d]" />
          </button>
        </div>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white border border-white/20">
            {githubUser ? githubUser.substring(0, 2).toUpperCase() : 'CS'}
          </div>
        </div>
      </div>
    </header>
  );
};

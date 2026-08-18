import React from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { GitBranch, Wifi, ShieldCheck, Terminal as TermIcon, FileCode } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { activeBranch, activeFileId, getFileById } = useWorkspaceStore();
  const activeFile = activeFileId ? getFileById(activeFileId) : null;

  return (
    <footer className="h-6 bg-[#090e18]/90 border-t border-white/10 flex items-center justify-between px-3 text-[11px] font-mono text-slate-400 z-30 select-none">
      {/* Left: Git Branch + Current Active File */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1 text-blue-400">
          <GitBranch className="w-3 h-3" />
          <span>{activeBranch}</span>
        </div>

        {activeFile && (
          <div className="flex items-center space-x-1.5 text-slate-300">
            <FileCode className="w-3 h-3 text-cyan-400" />
            <span>{activeFile.path}</span>
          </div>
        )}
      </div>

      {/* Right: Encoding, Language, Status indicators */}
      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center space-x-1 text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          <span>Sandbox Safe</span>
        </div>

        <div className="hidden md:flex items-center space-x-1 text-slate-400">
          <TermIcon className="w-3 h-3 text-amber-400" />
          <span>Node.js v22.22.1</span>
        </div>

        <span className="hidden sm:inline">UTF-8</span>
        <span>{activeFile?.language || 'TypeScript'}</span>

        <div className="flex items-center space-x-1 text-slate-300">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>Sync OK</span>
        </div>
      </div>
    </footer>
  );
};

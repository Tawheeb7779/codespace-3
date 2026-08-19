import React, { useState } from 'react';
import { Terminal as TerminalIcon, AlertTriangle, FileText, Activity, ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react';

interface BottomPanelProps {
  terminalComponent: React.ReactNode;
  problemsCount?: number;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({ terminalComponent, problemsCount = 0 }) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'problems' | 'output' | 'logs'>('terminal');
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="h-7 bg-surface-low border-t border-outline-variant/15 px-3 flex items-center justify-between text-[11px] text-outline z-30 select-none">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsCollapsed(false)} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>TERMINAL</span>
          </button>
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> {problemsCount} Problems
          </span>
        </div>
        <button onClick={() => setIsCollapsed(false)} className="hover:text-white transition-colors" title="Expand Panel">
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-52 bg-surface-low border-t border-outline-variant/15 flex flex-col z-30 select-none">
      {/* Header Tabs */}
      <div className="h-8 bg-surface-container-low border-b border-outline-variant/10 px-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1 font-mono text-[11px] flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'terminal' ? 'border-primary text-primary bg-primary/5 font-semibold' : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <TerminalIcon className="w-3 h-3" /> TERMINAL
          </button>
          <button
            onClick={() => setActiveTab('problems')}
            className={`px-3 py-1 font-mono text-[11px] flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'problems' ? 'border-primary text-primary bg-primary/5 font-semibold' : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3 h-3" /> PROBLEMS ({problemsCount})
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={`px-3 py-1 font-mono text-[11px] flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'output' ? 'border-primary text-primary bg-primary/5 font-semibold' : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <FileText className="w-3 h-3" /> OUTPUT
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 font-mono text-[11px] flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'logs' ? 'border-primary text-primary bg-primary/5 font-semibold' : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3" /> LOGS
          </button>
        </div>

        <div className="flex items-center gap-2 text-outline">
          <button className="p-1 hover:text-white rounded hover:bg-surface-high" title="New Terminal Session">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:text-white rounded hover:bg-surface-high" title="Clear Panel">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsCollapsed(true)} className="p-1 hover:text-white rounded hover:bg-surface-high" title="Collapse Panel">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative font-mono text-xs p-2">
        {activeTab === 'terminal' && terminalComponent}

        {activeTab === 'problems' && (
          <div className="h-full overflow-y-auto p-2 text-slate-300">
            {problemsCount === 0 ? (
              <div className="text-outline text-center py-6">No problems detected in workspace.</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>[Warning] App.tsx: Unused React import in line 1</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'output' && (
          <div className="h-full overflow-y-auto p-2 text-slate-400 space-y-1">
            <p className="text-emerald-400">[Vite Sandboxed Build Engine Ready]</p>
            <p>[CodeSpace 3D] Spatial graph structure indexed: 8 nodes</p>
            <p>[CodeSpace 3D] Monaco language server initialized</p>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="h-full overflow-y-auto p-2 text-slate-400 space-y-1">
            <p className="text-primary">[System Log] WebGL2 Context initialized with anti-aliasing</p>
            <p>[System Log] Local virtual file tree loaded from Zustand persistence</p>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal as TerminalIcon,
  AlertTriangle,
  FileText,
  ChevronUp,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { useRuntimeStore } from '../../runtime/RuntimeManager';

interface BottomPanelProps {
  terminalComponent: React.ReactNode;
}

type PanelTab = 'terminal' | 'problems' | 'output';

const LOG_TONE: Record<string, string> = {
  error: 'text-red-300',
  stderr: 'text-amber-300',
  info: 'text-primary',
  stdout: 'text-slate-300',
};

export const BottomPanel: React.FC<BottomPanelProps> = ({ terminalComponent }) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('terminal');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const logs = useRuntimeStore((s) => s.logs);
  const errors = useRuntimeStore((s) => s.errors);
  const clearLogs = useRuntimeStore((s) => s.clearLogs);

  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'output' && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  const problemsCount = errors.length;

  if (isCollapsed) {
    return (
      <div className="h-7 bg-surface-low border-t border-outline-variant/15 px-3 flex items-center justify-between text-[11px] text-outline z-30 select-none">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsCollapsed(false)} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>TERMINAL</span>
          </button>
          <span className="flex items-center gap-1">
            <AlertTriangle className={`w-3 h-3 ${problemsCount ? 'text-red-400' : 'text-outline'}`} /> {problemsCount} Problems
          </span>
        </div>
        <button onClick={() => setIsCollapsed(false)} className="hover:text-white transition-colors" title="Expand panel">
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const tabButton = (tab: PanelTab, label: string, icon: React.ReactNode): React.ReactNode => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-1 font-mono text-[11px] flex items-center gap-1.5 border-b-2 transition-all ${
        activeTab === tab ? 'border-primary text-primary bg-primary/5 font-semibold' : 'border-transparent text-outline hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="h-52 bg-surface-low border-t border-outline-variant/15 flex flex-col z-30 select-none">
      <div className="h-8 bg-surface-container-low border-b border-outline-variant/10 px-3 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-1">
          {tabButton('terminal', 'TERMINAL', <TerminalIcon className="w-3 h-3" />)}
          {tabButton('problems', `PROBLEMS (${problemsCount})`, <AlertTriangle className="w-3 h-3" />)}
          {tabButton('output', `OUTPUT (${logs.length})`, <FileText className="w-3 h-3" />)}
        </div>

        <div className="flex items-center gap-2 text-outline">
          <button
            onClick={clearLogs}
            className="p-1 hover:text-white rounded hover:bg-surface-high"
            title="Clear output and problems"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsCollapsed(true)} className="p-1 hover:text-white rounded hover:bg-surface-high" title="Collapse panel">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative font-mono text-xs p-2 min-h-0">
        {/* The terminal stays mounted: unmounting it would kill the running shell. */}
        <div className={activeTab === 'terminal' ? 'h-full' : 'hidden'}>{terminalComponent}</div>

        {activeTab === 'problems' && (
          <div className="h-full overflow-y-auto p-2 space-y-1.5">
            {problemsCount === 0 ? (
              <div className="text-outline text-center py-6">No runtime problems reported.</div>
            ) : (
              errors.map((message, index) => (
                <div key={`${index}-${message.slice(0, 24)}`} className="flex items-start gap-2 text-red-300">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                  <span className="whitespace-pre-wrap break-words">{message}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'output' && (
          <div ref={outputRef} className="h-full overflow-y-auto p-2 space-y-0.5">
            {logs.length === 0 ? (
              <div className="text-outline text-center py-6">
                No runtime output yet. Start the dev server or run a command in the terminal.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`flex gap-2 ${LOG_TONE[log.type] || 'text-slate-300'}`}>
                  <span className="text-outline/60 shrink-0">{log.timestamp}</span>
                  <span className="whitespace-pre-wrap break-words">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

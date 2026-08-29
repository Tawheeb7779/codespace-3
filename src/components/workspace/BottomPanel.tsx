import React, { useEffect, useMemo, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  AlertTriangle,
  FileText,
  GitBranch,
  ChevronUp,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { useRuntimeStore } from '../../runtime/RuntimeManager';
import { useProjectStore } from '../../store/useProjectStore';
import { useLayoutStore, BottomTab } from '../../store/useLayoutStore';

interface BottomPanelProps {
  terminalComponent: React.ReactNode;
}

const LOG_TONE: Record<string, string> = {
  error: 'text-[#ef233c]',
  stderr: 'text-amber-300',
  info: 'text-zinc-400',
  stdout: 'text-zinc-300',
};

/**
 * The workspace's bottom dock. Height and collapsed state live in the layout
 * store so the resize handle in the workspace shell and the status bar buttons
 * drive the same panel.
 */
export const BottomPanel: React.FC<BottomPanelProps> = ({ terminalComponent }) => {
  const activeTab = useLayoutStore((s) => s.bottomTab);
  const setActiveTab = useLayoutStore((s) => s.setBottomTab);
  const isCollapsed = useLayoutStore((s) => s.bottomCollapsed);
  const toggleCollapsed = useLayoutStore((s) => s.toggleBottom);
  const height = useLayoutStore((s) => s.bottomHeight);

  const logs = useRuntimeStore((s) => s.logs);
  const errors = useRuntimeStore((s) => s.errors);
  const clearLogs = useRuntimeStore((s) => s.clearLogs);

  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const gitStatus = useProjectStore((s) => s.gitStatus);
  const gitBranch = useProjectStore((s) => s.gitBranch);
  const openFile = useProjectStore((s) => s.openFile);

  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'output' && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  const project = projects.find((p) => p.id === activeProjectId);
  const unsavedFiles = useMemo(
    () => (project ? Object.values(project.files).filter((f) => !f.isFolder && f.isUnsaved) : []),
    [project]
  );

  const problemsCount = errors.length;
  const changedCount = gitStatus.unstaged.length + gitStatus.staged.length;

  if (isCollapsed) {
    return (
      <div className="h-7 shrink-0 bg-surface-low border-t border-white/10 px-3 flex items-center justify-between text-[11px] text-zinc-500 select-none">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleCollapsed}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <TerminalIcon className="w-3.5 h-3.5" /> Terminal
          </button>
          <span className="flex items-center gap-1">
            <AlertTriangle className={`w-3 h-3 ${problemsCount ? 'text-[#ef233c]' : ''}`} /> {problemsCount}
          </span>
        </div>
        <button onClick={toggleCollapsed} className="hover:text-white transition-colors" title="Expand panel (Ctrl/Cmd+J)">
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const tabButton = (tab: BottomTab, label: string, icon: React.ReactNode, badge?: number): React.ReactNode => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-2.5 py-1 text-[11px] flex items-center gap-1.5 border-b-2 transition-all ${
        activeTab === tab
          ? 'border-[#ef233c] text-white font-semibold'
          : 'border-transparent text-zinc-500 hover:text-white'
      }`}
    >
      {icon} {label}
      {badge !== undefined && badge > 0 && (
        <span className="px-1 rounded bg-[#ef233c]/20 text-[#ef233c] text-[10px] font-mono">{badge}</span>
      )}
    </button>
  );

  return (
    <div
      style={{ height }}
      className="shrink-0 bg-surface-low border-t border-white/10 flex flex-col select-none min-h-0"
    >
      <div className="h-8 shrink-0 bg-[#09090b] border-b border-white/10 px-2 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {tabButton('terminal', 'Terminal', <TerminalIcon className="w-3 h-3" />)}
          {tabButton('problems', 'Problems', <AlertTriangle className="w-3 h-3" />, problemsCount)}
          {tabButton('output', 'Output', <FileText className="w-3 h-3" />, logs.length)}
          {tabButton('git', 'Git', <GitBranch className="w-3 h-3" />, changedCount)}
        </div>

        <div className="flex items-center gap-1 text-zinc-500">
          <button
            onClick={clearLogs}
            className="p-1 hover:text-white rounded hover:bg-white/5 transition-colors"
            title="Clear output and problems"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleCollapsed}
            className="p-1 hover:text-white rounded hover:bg-white/5 transition-colors"
            title="Collapse panel (Ctrl/Cmd+J)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative font-mono text-xs min-h-0">
        {/* The terminal stays mounted: unmounting it would kill the running shell. */}
        <div className={activeTab === 'terminal' ? 'h-full p-1.5' : 'hidden'}>{terminalComponent}</div>

        {activeTab === 'problems' && (
          <div className="h-full overflow-y-auto p-2 space-y-1.5">
            {problemsCount === 0 && unsavedFiles.length === 0 ? (
              <div className="text-zinc-600 text-center py-6">No problems reported.</div>
            ) : (
              <>
                {errors.map((message, index) => (
                  <div key={`${index}-${message.slice(0, 24)}`} className="flex items-start gap-2 text-[#ef233c]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span className="whitespace-pre-wrap break-words">{message}</span>
                  </div>
                ))}
                {unsavedFiles.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-white/5 space-y-1">
                    {unsavedFiles.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => openFile(f.id)}
                        className="flex items-center gap-2 text-amber-400/80 hover:text-amber-300 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {f.path} has unsaved changes
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'output' && (
          <div ref={outputRef} className="h-full overflow-y-auto p-2 space-y-0.5">
            {logs.length === 0 ? (
              <div className="text-zinc-600 text-center py-6">
                No runtime output yet. Start the dev server or run a command in the terminal.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`flex gap-2 ${LOG_TONE[log.type] || 'text-zinc-300'}`}>
                  <span className="text-zinc-700 shrink-0">{log.timestamp}</span>
                  <span className="whitespace-pre-wrap break-words">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'git' && (
          <div className="h-full overflow-y-auto p-2 space-y-2">
            <div className="text-zinc-500 flex items-center gap-1.5">
              <GitBranch className="w-3 h-3 text-[#ef233c]" /> {gitBranch || 'main'}
            </div>
            {changedCount === 0 ? (
              <div className="text-zinc-600 text-center py-6">Working tree clean.</div>
            ) : (
              <>
                {gitStatus.staged.map((path) => (
                  <button
                    key={`s-${path}`}
                    onClick={() => openFile(path)}
                    className="w-full flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-left transition-colors"
                  >
                    <span className="w-4 shrink-0 text-center">S</span>
                    <span className="truncate">{path}</span>
                  </button>
                ))}
                {gitStatus.unstaged.map((path) => (
                  <button
                    key={`u-${path}`}
                    onClick={() => openFile(path)}
                    className="w-full flex items-center gap-2 text-amber-400 hover:text-amber-300 text-left transition-colors"
                  >
                    <span className="w-4 shrink-0 text-center">M</span>
                    <span className="truncate">{path}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

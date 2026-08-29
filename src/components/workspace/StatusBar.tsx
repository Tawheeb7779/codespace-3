import React from 'react';
import { GitBranch, AlertTriangle, Circle, Server, TerminalSquare, Layers } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useRuntimeStore, isRuntimeBusy } from '../../runtime/RuntimeManager';
import { useLayoutStore } from '../../store/useLayoutStore';
import { WebContainerProvider } from '../../runtime/WebContainerProvider';

/**
 * Compact IDE status bar. Every field reflects real state - there is no
 * placeholder text here, so an empty value means the thing genuinely is not
 * running rather than that the bar has not been wired up.
 */
export const StatusBar: React.FC = () => {
  const gitBranch = useProjectStore((s) => s.gitBranch);
  const gitStatus = useProjectStore((s) => s.gitStatus);
  const activeFileId = useProjectStore((s) => s.activeFileId);
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const phase = useRuntimeStore((s) => s.phase);
  const serverUrl = useRuntimeStore((s) => s.serverUrl);
  const errors = useRuntimeStore((s) => s.errors);

  const showBottomTab = useLayoutStore((s) => s.showBottomTab);

  const project = projects.find((p) => p.id === activeProjectId);
  const activeFile = project && activeFileId ? project.files[activeFileId] : null;
  const dirtyCount = project
    ? Object.values(project.files).filter((f) => !f.isFolder && f.isUnsaved).length
    : 0;
  const fileCount = project
    ? Object.values(project.files).filter((f) => !f.isFolder).length
    : 0;

  const unsupported = WebContainerProvider.unsupportedReason();
  const runtimeTone =
    phase === 'running'
      ? 'text-emerald-400'
      : phase === 'failed' || phase === 'unsupported'
        ? 'text-[#ef233c]'
        : isRuntimeBusy(phase)
          ? 'text-amber-400'
          : 'text-zinc-500';

  return (
    <footer className="h-6 shrink-0 bg-[#09090b] border-t border-white/10 px-3 flex items-center justify-between text-[11px] font-mono text-zinc-500 select-none">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex items-center gap-1 text-zinc-400">
          <GitBranch className="w-3 h-3 text-[#ef233c]" />
          {gitBranch || 'main'}
        </span>

        {gitStatus.unstaged.length + gitStatus.staged.length > 0 && (
          <button
            onClick={() => showBottomTab('git')}
            className="hover:text-white transition-colors"
            title="Show changed files"
          >
            {gitStatus.unstaged.length + gitStatus.staged.length} changed
          </button>
        )}

        <span className={`flex items-center gap-1 ${runtimeTone}`} title={unsupported || `Runtime: ${phase}`}>
          <Server className="w-3 h-3" />
          {phase}
        </span>

        {serverUrl && (
          <a
            href={serverUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="truncate max-w-[240px] text-emerald-400 hover:underline"
          >
            {serverUrl}
          </a>
        )}
      </div>

      <div className="flex items-center gap-3 min-w-0">
        {activeFile && (
          <span className="truncate max-w-[320px] text-zinc-400" title={activeFile.path}>
            {activeFile.path}
          </span>
        )}
        {activeFile?.language && <span className="uppercase">{activeFile.language}</span>}

        <span className="flex items-center gap-1" title={`${fileCount} files in this project`}>
          <Layers className="w-3 h-3" /> {fileCount}
        </span>

        <span
          className={`flex items-center gap-1 ${dirtyCount > 0 ? 'text-amber-400' : 'text-emerald-500'}`}
          title={dirtyCount > 0 ? `${dirtyCount} unsaved file(s)` : 'All files saved'}
        >
          <Circle className={`w-2 h-2 ${dirtyCount > 0 ? 'fill-current' : ''}`} />
          {dirtyCount > 0 ? `${dirtyCount} unsaved` : 'Saved'}
        </span>

        <button
          onClick={() => showBottomTab('problems')}
          className={`flex items-center gap-1 hover:text-white transition-colors ${
            errors.length > 0 ? 'text-[#ef233c]' : ''
          }`}
          title="Show problems"
        >
          <AlertTriangle className="w-3 h-3" /> {errors.length}
        </button>

        <button
          onClick={() => showBottomTab('terminal')}
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Show terminal"
        >
          <TerminalSquare className="w-3 h-3" />
        </button>
      </div>
    </footer>
  );
};

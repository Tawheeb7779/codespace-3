import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Files,
  TerminalSquare,
  Eye,
  Sparkles,
  GitBranch,
  Boxes,
  Play,
  Square,
  Loader2,
  Save,
  Command,
  MoreHorizontal,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { useRuntimeStore, isRuntimeBusy } from '../runtime/RuntimeManager';
import { Breakpoint } from '../hooks/useBreakpoint';
import { Sheet } from '../components/ui/Sheet';

import { CodeEditor } from '../components/workspace/CodeEditor';
import { FileExplorerPanel } from '../components/workspace/FileExplorerPanel';
import { LivePreview } from '../components/workspace/LivePreview';
import { Terminal } from '../components/workspace/Terminal';
import { AiAssistantDrawer } from '../components/workspace/AiAssistantDrawer';
import { GitSourceControlPanel } from '../components/workspace/GitSourceControlPanel';
import { Spatial3DWorkspace } from '../components/workspace/Spatial3DWorkspace';
import { ProjectInspectorPanel } from '../components/workspace/ProjectInspectorPanel';
import { CommandPaletteModal } from '../components/workspace/CommandPaletteModal';

type CompactPanel = 'files' | 'terminal' | 'preview' | 'ai' | 'git' | '3d' | 'inspector' | null;

interface WorkspaceCompactProps {
  breakpoint: Exclude<Breakpoint, 'desktop'>;
}

const PANEL_TITLES: Record<NonNullable<CompactPanel>, string> = {
  files: 'Files',
  terminal: 'Terminal',
  preview: 'Preview',
  ai: 'AI Assistant',
  git: 'Source Control',
  '3d': '3D Workspace',
  inspector: 'Project',
};

/**
 * Touch-first workspace for phones and tablets.
 *
 * The editor owns the screen; every other surface opens as a sheet over it
 * rather than competing for width. Nothing is a shrunken desktop panel: the
 * dock, targets and sheet sizes are sized for fingers.
 */
export default function WorkspaceCompact({ breakpoint }: WorkspaceCompactProps): React.ReactElement | null {
  const navigate = useNavigate();
  const isTablet = breakpoint === 'tablet';

  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const saveAllFiles = useProjectStore((s) => s.saveAllFiles);
  const activeFileId = useProjectStore((s) => s.activeFileId);

  const phase = useRuntimeStore((s) => s.phase);
  const serverUrl = useRuntimeStore((s) => s.serverUrl);
  const errors = useRuntimeStore((s) => s.errors);
  const startPreview = useRuntimeStore((s) => s.startPreview);
  const stopPreview = useRuntimeStore((s) => s.stopPreview);
  const refreshSupport = useRuntimeStore((s) => s.refreshSupport);

  const [panel, setPanel] = useState<CompactPanel>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('mobile');
  const [isRunActive, setIsRunActive] = useState(false);

  useEffect(() => {
    refreshSupport();
  }, [refreshSupport]);

  useEffect(() => {
    setIsRunActive(phase === 'running' || isRuntimeBusy(phase));
  }, [phase]);

  const project = projects.find((p) => p.id === activeProjectId);
  const activeFile = project && activeFileId ? project.files[activeFileId] : null;
  const dirtyCount = project
    ? Object.values(project.files).filter((f) => !f.isFolder && f.isUnsaved).length
    : 0;

  const busy = isRuntimeBusy(phase);

  const handleRun = useCallback(async () => {
    const current = useProjectStore.getState().getActiveProject();
    if (!current) return;
    if (phase === 'running' || isRuntimeBusy(phase)) {
      await stopPreview();
      return;
    }
    setPanel('preview');
    await startPreview(current.id, current.files);
  }, [phase, startPreview, stopPreview]);

  if (!project) return null;

  const dockItems: { id: NonNullable<CompactPanel>; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'files', label: 'Files', icon: <Files className="w-5 h-5" /> },
    { id: 'preview', label: 'Preview', icon: <Eye className="w-5 h-5" /> },
    { id: 'terminal', label: 'Terminal', icon: <TerminalSquare className="w-5 h-5" />, badge: errors.length },
    { id: 'ai', label: 'AI', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'git', label: 'Git', icon: <GitBranch className="w-5 h-5" /> },
  ];

  const renderPanelBody = (): React.ReactNode => {
    switch (panel) {
      case 'files':
        return <FileExplorerPanel />;
      case 'terminal':
        return (
          <div className="h-full p-2">
            <Terminal />
          </div>
        );
      case 'preview':
        return (
          <LivePreview
            previewDevice={previewDevice}
            setPreviewDevice={setPreviewDevice}
            isRunActive={isRunActive}
            setIsRunActive={setIsRunActive}
          />
        );
      case 'ai':
        return <AiAssistantDrawer isOpen docked onClose={() => setPanel(null)} />;
      case 'git':
        return <GitSourceControlPanel />;
      case '3d':
        return <Spatial3DWorkspace />;
      case 'inspector':
        return <ProjectInspectorPanel />;
      default:
        return null;
    }
  };

  // Files dock to the side on a tablet, where there is room; everything else is
  // a bottom sheet, which is where a thumb reaches.
  const sheetSide = panel === 'files' && isTablet ? 'left' : panel === 'ai' && isTablet ? 'right' : 'bottom';

  return (
    <div
      className="h-[100dvh] w-screen flex flex-col bg-background text-zinc-200 overflow-hidden font-sans"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="h-12 shrink-0 px-2 flex items-center gap-1.5 border-b border-white/10 bg-[#050507]">
        <button
          onClick={() => navigate('/dashboard')}
          aria-label="Back to projects"
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef233c]/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-white truncate leading-tight">{project.name}</div>
          <div className="text-[10px] text-zinc-500 truncate leading-tight font-mono">
            {activeFile ? activeFile.name : 'No file open'}
            {dirtyCount > 0 && <span className="text-amber-400"> · {dirtyCount} unsaved</span>}
          </div>
        </div>

        <button
          onClick={saveAllFiles}
          disabled={dirtyCount === 0}
          aria-label="Save all files"
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef233c]/50 transition-colors"
        >
          <Save className="w-4 h-4" />
        </button>

        <button
          onClick={handleRun}
          aria-label={isRunActive ? 'Stop the dev server' : 'Run the project'}
          className={`h-9 px-3 shrink-0 flex items-center gap-1.5 rounded-lg text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507] focus-visible:ring-[#ef233c]/50 transition-colors ${
            isRunActive ? 'bg-amber-500/15 text-amber-300' : 'bg-[#ef233c] text-white'
          }`}
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isRunActive ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span className="hidden sm:inline">{busy ? phase : isRunActive ? 'Stop' : 'Run'}</span>
        </button>

        {isTablet && (
          <button
            onClick={() => setIsPaletteOpen(true)}
            aria-label="Command palette"
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef233c]/50 transition-colors"
          >
            <Command className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* The editor owns the screen. */}
      <main className="flex-1 min-h-0 relative">
        <CodeEditor />
      </main>

      <nav
        className="shrink-0 border-t border-white/10 bg-[#09090b] flex items-stretch justify-around px-1"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Workspace panels"
      >
        {dockItems.map((item) => {
          const active = panel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPanel(active ? null : item.id)}
              aria-pressed={active}
              className={`relative flex-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ef233c]/50 transition-colors ${
                active ? 'text-[#ef233c]' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1.5 right-1/2 translate-x-4 min-w-[15px] h-[15px] px-1 rounded-full bg-[#ef233c] text-white text-[9px] font-mono leading-[15px] text-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => setPanel(panel === '3d' ? null : '3d')}
          aria-pressed={panel === '3d'}
          className={`relative flex-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${
            panel === '3d' ? 'text-[#ef233c]' : 'text-zinc-500 hover:text-zinc-200'
          }`}
        >
          <Boxes className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">3D</span>
        </button>
      </nav>

      <Sheet
        open={panel !== null}
        onClose={() => setPanel(null)}
        side={sheetSide}
        title={panel ? PANEL_TITLES[panel] : ''}
        heightRatio={panel === 'terminal' ? 0.55 : 0.8}
        headerAccessory={
          panel === 'preview' && serverUrl ? (
            <a
              href={serverUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="px-2 h-9 flex items-center text-[11px] font-mono text-emerald-400 hover:underline"
            >
              Open
            </a>
          ) : panel === 'files' ? (
            <button
              onClick={() => setPanel('inspector')}
              aria-label="Project information"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          ) : null
        }
      >
        {renderPanelBody()}
      </Sheet>

      <CommandPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectView={() => setIsPaletteOpen(false)}
        toggleAi={() => setPanel('ai')}
      />
    </div>
  );
}

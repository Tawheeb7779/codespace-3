import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Play,
  Square,
  Globe,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useRuntimeStore } from '../../runtime/RuntimeManager';
import { buildStaticPreview } from '../../runtime/staticPreview';

interface LivePreviewProps {
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  isRunActive: boolean;
  setIsRunActive: (active: boolean) => void;
}

const PHASE_LABEL: Record<string, string> = {
  idle: 'Stopped',
  unsupported: 'Runtime unavailable',
  booting: 'Booting runtime...',
  mounting: 'Mounting files...',
  installing: 'Installing packages...',
  starting: 'Starting dev server...',
  ready: 'Dev server running',
  stopping: 'Stopping...',
  error: 'Runtime error',
};

export const LivePreview: React.FC<LivePreviewProps> = ({
  previewDevice,
  setPreviewDevice,
  isRunActive,
  setIsRunActive,
}) => {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const phase = useRuntimeStore((s) => s.phase);
  const serverUrl = useRuntimeStore((s) => s.serverUrl);
  const errors = useRuntimeStore((s) => s.errors);
  const unsupportedReason = useRuntimeStore((s) => s.unsupportedReason);
  const start = useRuntimeStore((s) => s.start);
  const stop = useRuntimeStore((s) => s.stop);
  const refreshSupport = useRuntimeStore((s) => s.refreshSupport);
  const addLog = useRuntimeStore((s) => s.addLog);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === activeProjectId);

  useEffect(() => {
    refreshSupport();
  }, [refreshSupport]);

  /**
   * Static preview is only produced for projects that ship an index.html and do
   * not need a build step. It is explicitly labelled so it is never mistaken
   * for the real dev server.
   */
  const staticPreview = useMemo(
    () => (currentProject ? buildStaticPreview(currentProject.files) : null),
    [currentProject]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent): void => {
      if (event.data && event.data.type === 'CODESPACE_PREVIEW_ERROR') {
        const message = String(event.data.error);
        setPreviewError(message);
        addLog('error', `[Preview] ${message}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addLog]);

  const handleToggleRun = useCallback(async () => {
    if (!currentProject) return;
    if (isRunActive) {
      setIsRunActive(false);
      await stop();
      return;
    }
    setIsRunActive(true);
    setPreviewError(null);
    await start(currentProject.id, currentProject.files);
  }, [currentProject, isRunActive, setIsRunActive, start, stop]);

  const viewportClass = (): string => {
    switch (previewDevice) {
      case 'mobile':
        return 'w-[375px] h-[667px] border-[12px] border-slate-800 rounded-[36px] shadow-2xl';
      case 'tablet':
        return 'w-[768px] h-[900px] border-[8px] border-slate-800 rounded-[20px] shadow-2xl';
      default:
        return 'w-full h-full rounded-none';
    }
  };

  const busy = phase === 'booting' || phase === 'mounting' || phase === 'installing' || phase === 'starting';
  const lastError = errors[errors.length - 1] || null;

  const statusTone =
    phase === 'ready'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : phase === 'error' || phase === 'unsupported'
        ? 'bg-red-500/20 text-red-300 border-red-500/30'
        : busy
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
          : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

  const renderBody = (): React.ReactNode => {
    if (serverUrl) {
      return (
        <div className={`transition-all duration-300 overflow-hidden bg-slate-950 ${viewportClass()}`}>
          <iframe
            key={reloadKey}
            title="WebContainer dev server preview"
            src={serverUrl}
            className="w-full h-full border-0"
          />
        </div>
      );
    }

    if (busy) {
      return (
        <div className="flex flex-col items-center justify-center text-outline gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">{PHASE_LABEL[phase]}</p>
          <p className="text-[11px] text-outline/70 max-w-sm text-center">
            Output is streaming into the terminal panel below.
          </p>
        </div>
      );
    }

    if (staticPreview) {
      return (
        <div className={`transition-all duration-300 overflow-hidden bg-white ${viewportClass()}`}>
          <iframe
            key={reloadKey}
            title="Static HTML preview"
            srcDoc={staticPreview.html}
            sandbox="allow-scripts allow-modals allow-forms"
            className="w-full h-full border-0"
          />
        </div>
      );
    }

    if (phase === 'unsupported' || unsupportedReason) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 max-w-md text-center px-6">
          <ShieldAlert className="w-9 h-9 text-red-400" />
          <p className="text-sm text-slate-200 font-medium">In-browser runtime unavailable</p>
          <p className="text-xs text-outline leading-relaxed">{unsupportedReason}</p>
          <p className="text-[11px] text-outline/70">
            The editor, file system and project persistence continue to work normally.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center text-outline gap-3 px-6 text-center">
        <Square className="w-10 h-10 opacity-30" />
        <p className="text-sm">
          {phase === 'error'
            ? 'The dev server is not running.'
            : 'No dev server running and no static index.html to preview.'}
        </p>
        {lastError && <p className="text-xs text-red-300 max-w-md">{lastError}</p>}
        <button
          onClick={handleToggleRun}
          className="px-4 py-2 bg-primary-container text-white text-xs font-medium rounded-lg hover:bg-primary-container/80 transition-all flex items-center gap-2"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Start dev server
        </button>
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col bg-[#0b0f19] ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'}`}>
      <div className="h-10 bg-surface-low border-b border-outline-variant/15 px-3 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px] shrink-0">
            <Globe className="w-3.5 h-3.5 text-primary" /> LIVE PREVIEW
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${statusTone}`}>
            {serverUrl ? 'Dev server' : staticPreview ? 'Static preview' : PHASE_LABEL[phase] || phase}
          </span>
          {serverUrl && (
            <span className="text-[10px] font-mono text-emerald-400 truncate">{serverUrl}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPreviewDevice('desktop')}
            className={`p-1.5 rounded transition-all ${previewDevice === 'desktop' ? 'bg-primary/20 text-primary' : 'text-outline hover:text-white'}`}
            title="Desktop Mode"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPreviewDevice('tablet')}
            className={`p-1.5 rounded transition-all ${previewDevice === 'tablet' ? 'bg-primary/20 text-primary' : 'text-outline hover:text-white'}`}
            title="Tablet Mode"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPreviewDevice('mobile')}
            className={`p-1.5 rounded transition-all ${previewDevice === 'mobile' ? 'bg-primary/20 text-primary' : 'text-outline hover:text-white'}`}
            title="Mobile Mode"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRun}
            disabled={busy}
            className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-all disabled:opacity-50 ${
              phase === 'ready' || busy
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
            }`}
          >
            {phase === 'ready' || busy ? (
              <Square className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span>{phase === 'ready' || busy ? 'Stop' : 'Run'}</span>
          </button>

          <button
            onClick={() => {
              setPreviewError(null);
              setReloadKey((k) => k + 1);
            }}
            className="p-1.5 text-outline hover:text-white rounded hover:bg-surface-high transition-colors"
            title="Reload Preview"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-outline hover:text-white rounded hover:bg-surface-high transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative bg-[#090d16]">
        {previewError && (
          <div className="absolute top-4 left-4 right-4 z-20 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="truncate">Preview error: {previewError}</span>
            </div>
            <button onClick={() => setPreviewError(null)} className="text-red-400 hover:text-white shrink-0">
              Dismiss
            </button>
          </div>
        )}

        {staticPreview && !serverUrl && (
          <div className="absolute bottom-3 left-4 right-4 z-10 text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded px-2 py-1">
            Static preview of {staticPreview.entryPath} - no bundler or npm packages. Run the dev server for the
            full application.
          </div>
        )}

        {renderBody()}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useRuntimeStore } from '../../runtime/RuntimeManager';
import { PreviewPhase } from '../../types/runtime';
import { buildStaticPreview } from '../../runtime/staticPreview';

interface LivePreviewProps {
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  isRunActive: boolean;
  setIsRunActive: (active: boolean) => void;
}

const PHASE_LABEL: Record<PreviewPhase, string> = {
  idle: 'Idle',
  unsupported: 'WebContainer Unsupported',
  booting: 'Booting WebContainer',
  mounting: 'Mounting Project Files',
  installing: 'Installing Dependencies',
  starting: 'Starting Dev Server',
  running: 'Dev Server Running',
  stopping: 'Stopping',
  stopped: 'Stopped',
  failed: 'Failed',
};

const PHASE_BADGE: Record<PreviewPhase, string> = {
  idle: 'bg-surface-high text-outline border-outline-variant/30',
  unsupported: 'bg-red-500/20 text-red-300 border-red-500/30',
  booting: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  mounting: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  installing: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  starting: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  running: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  stopping: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  stopped: 'bg-surface-high text-outline border-outline-variant/30',
  failed: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const BUSY_PHASES: PreviewPhase[] = ['booting', 'mounting', 'installing', 'starting'];

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
  const error = useRuntimeStore((s) => s.error);
  const logs = useRuntimeStore((s) => s.logs);
  const startPreview = useRuntimeStore((s) => s.startPreview);
  const stopPreview = useRuntimeStore((s) => s.stopPreview);
  const refreshSupport = useRuntimeStore((s) => s.refreshSupport);
  const addLog = useRuntimeStore((s) => s.addLog);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === activeProjectId);

  const start = useCallback(() => {
    if (!currentProject) return;
    void startPreview(currentProject.id, currentProject.files);
  }, [currentProject, startPreview]);

  useEffect(() => {
    refreshSupport();
  }, [refreshSupport]);

  useEffect(() => {
    if (isRunActive) {
      start();
    } else {
      void stopPreview();
    }
  }, [isRunActive, start, stopPreview]);

  /**
   * Static fallback for projects that ship an index.html needing no build step.
   * It is labelled as such so it is never mistaken for the real dev server, and
   * returns null for anything that needs a bundler.
   */
  const staticPreview = useMemo(
    () => (currentProject ? buildStaticPreview(currentProject.files) : null),
    [currentProject]
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      if (event.data && event.data.type === 'CODESPACE_PREVIEW_ERROR') {
        const message = String(event.data.error);
        setPreviewError(message);
        addLog('error', `[Preview] ${message}`);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [addLog]);

  const getViewportDimensions = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'w-[375px] h-[667px] border-[12px] border-slate-800 rounded-[36px] shadow-2xl';
      case 'tablet':
        return 'w-[768px] h-[900px] border-[8px] border-slate-800 rounded-[20px] shadow-2xl';
      default:
        return 'w-full h-full rounded-none';
    }
  };

  const isBusy = BUSY_PHASES.includes(phase);
  const recentLogs = logs.slice(-8);

  return (
    <div className={`h-full flex flex-col bg-[#0b0f19] ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'}`}>
      {/* Top Controls Bar */}
      <div className="h-10 bg-surface-low border-b border-outline-variant/15 px-3 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
            <Globe className="w-3.5 h-3.5 text-primary" /> LIVE PREVIEW
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 ${PHASE_BADGE[phase]}`}>
            {isBusy && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
            {PHASE_LABEL[phase]}
          </span>
          {serverUrl && (
            <span className="text-[10px] font-mono text-outline truncate max-w-[220px]" title={serverUrl}>
              {serverUrl}
            </span>
          )}
        </div>

        {/* Viewport Toggles */}
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
            onClick={() => setIsRunActive(!isRunActive)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-all ${
              isRunActive ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
            }`}
          >
            {isRunActive ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isRunActive ? 'Stop' : 'Start'}</span>
          </button>

          <button
            onClick={() => setKey((k) => k + 1)}
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

      {/* Main Preview Container */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative bg-[#090d16]">
        {previewError && (
          <div className="absolute top-3 left-4 right-4 z-20 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="truncate">Preview error: {previewError}</span>
            </div>
            <button onClick={() => setPreviewError(null)} className="shrink-0 hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        {phase === 'running' && serverUrl ? (
          <div className={`transition-all duration-300 overflow-hidden bg-slate-950 ${getViewportDimensions()}`}>
            <iframe
              key={key}
              title="WebContainer Dev Server Preview"
              src={serverUrl}
              className="w-full h-full border-0"
              allow="cross-origin-isolated"
            />
          </div>
        ) : staticPreview && !isBusy ? (
          <div className="w-full h-full flex flex-col items-center gap-2">
            <div className={`transition-all duration-300 overflow-hidden bg-white ${getViewportDimensions()}`}>
              <iframe
                key={key}
                title="Static HTML Preview"
                srcDoc={staticPreview.html}
                sandbox="allow-scripts allow-modals allow-forms"
                className="w-full h-full border-0"
              />
            </div>
            <p className="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded px-2 py-1">
              Static preview of {staticPreview.entryPath} - no bundler or npm packages. Start the dev server for the
              full application.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-xl flex flex-col items-center justify-center gap-4 text-center">
            {isBusy && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
            {(phase === 'failed' || phase === 'unsupported') && <AlertTriangle className="w-8 h-8 text-red-400" />}
            {(phase === 'idle' || phase === 'stopped') && <Square className="w-8 h-8 opacity-30 text-outline" />}

            <p className="text-sm text-slate-300 font-medium">{PHASE_LABEL[phase]}</p>

            {error && (
              <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 font-mono text-left w-full">
                {error}
              </p>
            )}

            {(phase === 'idle' || phase === 'stopped' || phase === 'failed') && (
              <button
                onClick={() => {
                  setIsRunActive(true);
                  start();
                }}
                className="px-4 py-2 bg-primary-container text-white text-xs font-medium rounded-lg hover:bg-primary-container/80 transition-all flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {phase === 'failed' ? 'Retry Dev Server' : 'Start Dev Server'}
              </button>
            )}

            {recentLogs.length > 0 && phase !== 'idle' && (
              <div className="w-full max-h-40 overflow-auto bg-[#050507] border border-outline-variant/20 rounded-lg p-3 text-left font-mono text-[10px] leading-relaxed">
                {recentLogs.map((log) => (
                  <div key={log.id} className={log.type === 'error' ? 'text-red-300' : 'text-outline'}>
                    {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
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
  Globe
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useRuntimeStore } from '../../runtime/RuntimeManager';
import { CompilerEngine } from '../../runtime/CompilerEngine';

interface LivePreviewProps {
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  isRunActive: boolean;
  setIsRunActive: (active: boolean) => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  previewDevice,
  setPreviewDevice,
  isRunActive,
  setIsRunActive,
}) => {
  const { projects, activeProjectId } = useProjectStore();
  const { isRunning, webContainerUrl, addLog } = useRuntimeStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === activeProjectId);

  // Synthesize compiled executable HTML/React bundle for fallback iframe sandbox
  const iframeSrcDoc = useMemo(() => {
    if (!currentProject) return '';

    const files = currentProject.files;
    let customHtml = '';
    let cssContent = '';
    const tsxOutputs: string[] = [];

    Object.values(files).forEach((file) => {
      if (file.isFolder) return;
      if (file.name.endsWith('.html')) customHtml = file.content;
      if (file.name.endsWith('.css')) cssContent += `\n${file.content}`;
      if (file.name.endsWith('.tsx') || file.name.endsWith('.ts') || file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        const js = CompilerEngine.transpileTsx(file.content);
        tsxOutputs.push(`// --- Module: ${file.name} ---\n${js}`);
      }
    });

    if (customHtml) {
      return customHtml;
    }

    const compiledJsBundle = tsxOutputs.join('\n\n');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <style>${cssContent}</style>
          <script>
            window.onerror = function(msg, url, line) {
              window.parent.postMessage({ type: 'PREVIEW_ERROR', error: msg + ' (Line ' + line + ')' }, '*');
            };
          </script>
        </head>
        <body class="bg-slate-950 text-white min-h-screen p-4 font-sans">
          <div id="root">
            <div class="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-4 max-w-xl mx-auto mt-8 shadow-2xl">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                <h2 class="text-xl font-bold text-blue-400">CodeSpace 3D React Runtime Engine</h2>
              </div>
              <p class="text-sm text-slate-300 leading-relaxed">
                Active in-browser transpiled React + TSX application executing dynamically inside sandboxed Vite/React runtime context.
              </p>
              <div class="p-4 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-slate-400 space-y-1">
                <div>Project: <span class="text-white">${currentProject.name}</span></div>
                <div>Runtime Mode: <span class="text-emerald-400">In-Browser TSX Compiler (React 18)</span></div>
                <div>Vite Dev Port: <span class="text-blue-400">5173</span></div>
              </div>
            </div>
          </div>

          <script type="text/babel">
            try {
              ${compiledJsBundle}
            } catch(e) {
              window.onerror(e.message, '', 0);
            }
          </script>
        </body>
      </html>
    `;
  }, [currentProject]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PREVIEW_ERROR') {
        setRuntimeError(event.data.error);
        addLog('error', `[Runtime Error] ${event.data.error}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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

  return (
    <div className={`h-full flex flex-col bg-[#0b0f19] ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'}`}>
      {/* Top Controls Bar */}
      <div className="h-10 bg-surface-low border-b border-outline-variant/15 px-3 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
            <Globe className="w-3.5 h-3.5 text-primary" /> LIVE PREVIEW
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
            isRunActive && isRunning
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            {webContainerUrl ? 'WebContainer Server' : (isRunActive && isRunning ? 'Vite Dev Server Active' : 'Stopped')}
          </span>
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
        {runtimeError && (
          <div className="absolute top-4 left-4 right-4 z-20 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Runtime Error: {runtimeError}</span>
            </div>
            <button onClick={() => setRuntimeError(null)} className="text-red-400 hover:text-white">Dismiss</button>
          </div>
        )}

        {isRunActive && isRunning ? (
          <div className={`transition-all duration-300 overflow-hidden bg-slate-950 ${getViewportDimensions()}`}>
            {webContainerUrl ? (
              <iframe
                key={key}
                title="WebContainer Real Process Preview"
                src={webContainerUrl}
                className="w-full h-full border-0"
              />
            ) : (
              <iframe
                key={key}
                title="CodeSpace 3D React Runtime Preview"
                srcDoc={iframeSrcDoc}
                sandbox="allow-scripts allow-modals"
                className="w-full h-full border-0"
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-outline gap-3">
            <Square className="w-10 h-10 opacity-30" />
            <p className="text-sm">Runtime dev server is currently stopped.</p>
            <button
              onClick={() => setIsRunActive(true)}
              className="px-4 py-2 bg-primary-container text-white text-xs font-medium rounded-lg hover:bg-primary-container/80 transition-all flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Launch Vite Dev Server
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

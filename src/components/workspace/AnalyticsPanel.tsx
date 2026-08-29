import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Zap,
  HardDrive,
  ShieldCheck,
  BarChart2,
  CheckCircle2,
  Terminal as TerminalIcon
} from 'lucide-react';
import { usePreferenceStore } from '../../store/usePreferenceStore';
import { useRuntimeStore } from '../../runtime/RuntimeManager';
import { WebContainerProvider } from '../../runtime/WebContainerProvider';

export const AnalyticsPanel: React.FC = () => {
  const render3DQuality = usePreferenceStore((s) => s.render3DQuality);
  const phase = useRuntimeStore((s) => s.phase);
  const isRunning = useRuntimeStore((s) => s.isRunning);
  const serverUrl = useRuntimeStore((s) => s.serverUrl);
  // Read straight from the provider: this reflects the browser context itself,
  // not whether a run has been attempted yet.
  const unsupportedReason = WebContainerProvider.unsupportedReason();
  const [fps, setFps] = useState<number>(0);
  const [memoryMb, setMemoryMb] = useState<string>('Unavailable');

  // Frame-rate sampling stops as soon as the tab is hidden, so a background
  // workspace does not keep a rAF loop alive.
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId = 0;

    const measureFps = () => {
      frameCount += 1;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measureFps);
    };

    const startLoop = () => {
      if (animId) return;
      lastTime = performance.now();
      frameCount = 0;
      animId = requestAnimationFrame(measureFps);
    };
    const stopLoop = () => {
      if (!animId) return;
      cancelAnimationFrame(animId);
      animId = 0;
    };

    const onVisibility = () => (document.hidden ? stopLoop() : startLoop());
    document.addEventListener('visibilitychange', onVisibility);
    if (!document.hidden) startLoop();

    const readMemory = () => {
      const perf = performance as unknown as { memory?: { usedJSHeapSize: number } };
      if (perf.memory?.usedJSHeapSize) {
        setMemoryMb(`${(perf.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)} MB`);
      }
    };
    readMemory();
    const memoryTimer = window.setInterval(readMemory, 2000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stopLoop();
      window.clearInterval(memoryTimer);
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-surface-low text-xs select-none border-r border-outline-variant/15 p-3 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
        <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px] flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> PERFORMANCE & ANALYTICS
        </span>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 text-[10px]">
          LIVE TELEMETRY
        </span>
      </div>

      {/* WebGL Performance Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/15 space-y-1">
          <div className="flex items-center justify-between text-outline text-[10px]">
            <span>Measured FPS</span>
            <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
          </div>
          <div className="text-lg font-bold text-white font-mono">{fps} FPS</div>
          <div className="text-[10px] text-emerald-400 font-mono">Profile: {render3DQuality.toUpperCase()}</div>
        </div>

        <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/15 space-y-1">
          <div className="flex items-center justify-between text-outline text-[10px]">
            <span>JS Heap Memory</span>
            <Cpu className="w-3 h-3 text-primary" />
          </div>
          <div className="text-lg font-bold text-white font-mono">{memoryMb}</div>
          <div className="text-[10px] text-slate-400 font-mono">
            {memoryMb === 'Unavailable' ? 'Browser API Restricted' : 'Real JS Heap'}
          </div>
        </div>
      </div>

      {/* WebContainer Process Telemetry */}
      <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-200 flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-secondary" /> WebContainer Runtime Engine
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isRunning ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-surface-high text-outline'}`}>
            {phase}
          </span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between text-slate-300">
            <span>Dev Server Endpoint:</span>
            <span className="font-mono text-emerald-400 truncate max-w-[140px]">
              {serverUrl ? serverUrl : 'No server running'}
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Isolation Mode:</span>
            <span
              className={`font-mono flex items-center gap-1 ${unsupportedReason ? 'text-amber-400' : 'text-emerald-400'}`}
              title={unsupportedReason || 'Cross-origin isolated'}
            >
              <ShieldCheck className="w-3 h-3" />
              {unsupportedReason ? 'Not cross-origin isolated' : 'COOP / COEP active'}
            </span>
          </div>
        </div>
      </div>

      {/* Persistent Storage */}
      <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-2">
        <div className="flex items-center justify-between text-slate-200 font-medium">
          <span className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-tertiary" /> Client Storage Persistence</span>
          <span className="font-mono text-[10px] text-emerald-400">localStorage (throttled writes)</span>
        </div>
        <div className="w-full h-1.5 bg-surface-high rounded-full overflow-hidden">
          <div className="h-full bg-tertiary rounded-full w-[100%]" />
        </div>
      </div>

      {/* Summary */}
      <div className="p-3 bg-surface-high/50 rounded-lg border border-outline-variant/10 space-y-1.5 text-[11px] text-slate-300">
        <div className="font-semibold text-white flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-primary" /> System Metrics Status
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" /> FPS and heap readings come from real browser APIs; runtime state
          reflects the actual WebContainer process.
        </div>
      </div>
    </div>
  );
};

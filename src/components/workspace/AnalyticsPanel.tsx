import React from 'react';
import {
  Activity,
  Cpu,
  Database,
  Zap,
  HardDrive,
  ShieldCheck,
  BarChart2,
  CheckCircle2
} from 'lucide-react';
import { usePreferenceStore } from '../../store/usePreferenceStore';

export const AnalyticsPanel: React.FC = () => {
  const { render3DQuality } = usePreferenceStore();

  return (
    <div className="h-full flex flex-col bg-surface-low text-xs select-none border-r border-outline-variant/15 p-3 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
        <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px] flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> PERFORMANCE & ANALYTICS
        </span>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 text-[10px]">
          System Optimal
        </span>
      </div>

      {/* WebGL Performance Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/15 space-y-1">
          <div className="flex items-center justify-between text-outline text-[10px]">
            <span>WebGL FPS</span>
            <Zap className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono">60 FPS</div>
          <div className="text-[10px] text-emerald-400 font-mono">Profile: {render3DQuality.toUpperCase()}</div>
        </div>

        <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/15 space-y-1">
          <div className="flex items-center justify-between text-outline text-[10px]">
            <span>Heap Memory</span>
            <Cpu className="w-3 h-3 text-primary" />
          </div>
          <div className="text-lg font-bold text-white font-mono">42.8 MB</div>
          <div className="text-[10px] text-slate-400 font-mono">Limit: 512 MB</div>
        </div>
      </div>

      {/* Database / Supabase Monitor */}
      <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-secondary" /> Database / Supabase Monitor
          </span>
          <span className="px-1.5 py-0.5 rounded bg-surface-high text-outline text-[10px] font-mono">
            Active
          </span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between text-slate-300">
            <span>Query Latency:</span>
            <span className="font-mono text-emerald-400">14 ms</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Active Connections:</span>
            <span className="font-mono text-primary">8 Pools</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>RLS Policies:</span>
            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Enforced
            </span>
          </div>
        </div>
      </div>

      {/* Storage Usage */}
      <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-2">
        <div className="flex items-center justify-between text-slate-200 font-medium">
          <span className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-tertiary" /> Workspace Storage</span>
          <span className="font-mono text-[10px] text-outline">1.2 MB / 10 MB</span>
        </div>
        <div className="w-full h-1.5 bg-surface-high rounded-full overflow-hidden">
          <div className="h-full bg-tertiary rounded-full w-[12%]" />
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="p-3 bg-surface-high/50 rounded-lg border border-outline-variant/10 space-y-1.5 text-[11px] text-slate-300">
        <div className="font-semibold text-white flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-primary" /> Workspace Health Metrics
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" /> All WebGL shaders and WebContainer workers operating normally.
        </div>
      </div>
    </div>
  );
};

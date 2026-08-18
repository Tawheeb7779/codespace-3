import React from 'react';
import { BarChart3, Activity, Cpu, Zap, HardDrive, Shield } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const metrics = [
    { label: 'WebGL Frame Rate', value: '60 FPS', sub: '0.2ms Frame Delay', icon: Zap, color: 'text-amber-400' },
    { label: 'WASM Virtual Memory', value: '128 MB', sub: '12% Peak Allocation', icon: Cpu, color: 'text-blue-400' },
    { label: 'Bundle Build Time', value: '210 ms', sub: 'Vite 6 HMR Ready', icon: Activity, color: 'text-emerald-400' },
    { label: 'Cache Hit Ratio', value: '99.4%', sub: 'IndexedDB Store Active', icon: HardDrive, color: 'text-purple-400' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <span>IDE Performance & Build Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time insights into WebGL rendering, WASM memory, build times, and cache hit ratios
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-[#171c26]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{m.label}</span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <div className="text-2xl font-bold font-mono text-white">{m.value}</div>
              <div className="text-[11px] font-mono text-slate-400">{m.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Simulated Spatial Render Graph */}
      <div className="bg-[#171c26]/70 border border-white/10 rounded-xl p-5 backdrop-blur-md space-y-4">
        <h2 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Realtime Render Loop & Memory Graph</span>
        </h2>

        <div className="h-48 bg-[#0e131d] rounded-lg border border-white/10 flex items-end p-4 space-x-2">
          {[40, 55, 60, 58, 60, 60, 59, 60, 60, 60, 57, 60, 60, 60, 60, 58, 60, 60].map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                style={{ height: `${val}%` }}
                className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t transition-all group-hover:brightness-125"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

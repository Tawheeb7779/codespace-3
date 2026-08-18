import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Terminal,
  Play,
  GitBranch,
  Sparkles,
  Zap,
  Activity,
  Box,
  Cpu,
  Layers,
  Clock,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { useIntegrationsStore } from '../stores/useIntegrationsStore';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { files, activeBranch } = useWorkspaceStore();
  const { githubUser, nexusAiModel } = useIntegrationsStore();

  const quickStats = [
    { label: 'Files in Workspace', value: '14 Files', icon: Code2, color: 'text-blue-400' },
    { label: 'Active Git Branch', value: activeBranch, icon: GitBranch, color: 'text-emerald-400' },
    { label: 'AI Model Engaged', value: nexusAiModel.split(' ')[0], icon: Sparkles, color: 'text-purple-400' },
    { label: 'GPU Render Pipeline', value: '60 FPS / WebGL2', icon: Zap, color: 'text-amber-400' },
  ];

  const recentProjects = [
    { name: 'codespace-3d-app', lang: 'TypeScript / React', status: 'Active', updated: '2 mins ago' },
    { name: 'threejs-spatial-shader', lang: 'GLSL / Three.js', status: 'Deployed', updated: '3 hours ago' },
    { name: 'nexus-ai-orchestrator', lang: 'TypeScript / Node', status: 'Building', updated: '1 day ago' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 select-none">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-[#171c26]/80 p-6 md:p-8 backdrop-blur-md glass-panel">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-blue-400 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Developer Command Center</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white font-sans">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">{githubUser || 'Engineer'}</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              CodeSpace 3D Spatial IDE is primed. Monaco editor, in-browser WASM terminal, Three.js spatial canvas, and Nexus AI are ready for development.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/workspace')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-600/30 border border-blue-400/30"
            >
              <Code2 className="w-4 h-4" />
              <span>Open Workspace</span>
            </button>

            <button
              onClick={() => navigate('/ai')}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all border border-white/10 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Launch Nexus AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-[#171c26]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md hover:border-blue-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="mt-2 text-xl font-bold font-mono text-slate-100">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Quick Actions + Recent Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Nav Actions */}
          <div className="bg-[#171c26]/70 border border-white/10 rounded-xl p-5 backdrop-blur-md space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>IDE Modules & Quick Navigation</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-sans">
              <button
                onClick={() => navigate('/workspace')}
                className="p-3 bg-white/5 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 rounded-lg flex flex-col items-start text-left transition-all group"
              >
                <Code2 className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-200">Code Editor</span>
                <span className="text-[10px] text-slate-400">Monaco & Tabs</span>
              </button>

              <button
                onClick={() => navigate('/terminal')}
                className="p-3 bg-white/5 hover:bg-emerald-600/20 border border-white/5 hover:border-emerald-500/30 rounded-lg flex flex-col items-start text-left transition-all group"
              >
                <Terminal className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-200">Interactive Terminal</span>
                <span className="text-[10px] text-slate-400">Node & Git CLI</span>
              </button>

              <button
                onClick={() => navigate('/preview')}
                className="p-3 bg-white/5 hover:bg-cyan-600/20 border border-white/5 hover:border-cyan-500/30 rounded-lg flex flex-col items-start text-left transition-all group"
              >
                <Play className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-200">Live Preview</span>
                <span className="text-[10px] text-slate-400">Sandbox Iframe</span>
              </button>

              <button
                onClick={() => navigate('/source-control')}
                className="p-3 bg-white/5 hover:bg-amber-600/20 border border-white/5 hover:border-amber-500/30 rounded-lg flex flex-col items-start text-left transition-all group"
              >
                <GitBranch className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-200">Source Control</span>
                <span className="text-[10px] text-slate-400">Commits & Diff</span>
              </button>

              <button
                onClick={() => navigate('/packages')}
                className="p-3 bg-white/5 hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/30 rounded-lg flex flex-col items-start text-left transition-all group"
              >
                <Box className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-200">Package Manager</span>
                <span className="text-[10px] text-slate-400">NPM Dependencies</span>
              </button>

              <button
                onClick={() => navigate('/integrations')}
                className="p-3 bg-white/5 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 rounded-lg flex flex-col items-start text-left transition-all group"
              >
                <Cpu className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-200">Cloud Integrations</span>
                <span className="text-[10px] text-slate-400">Vercel & Supabase</span>
              </button>
            </div>
          </div>

          {/* Recent Projects Table */}
          <div className="bg-[#171c26]/70 border border-white/10 rounded-xl p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Recent Workspaces</span>
              </h2>
              <button onClick={() => navigate('/workspace')} className="text-xs text-blue-400 hover:underline flex items-center space-x-1">
                <span>View all</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {recentProjects.map((proj, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 font-mono text-xs">
                  <div>
                    <div className="font-semibold text-slate-100">{proj.name}</div>
                    <div className="text-[11px] text-slate-400">{proj.lang}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {proj.status}
                    </span>
                    <span className="text-[11px] text-slate-400">{proj.updated}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): System Health & Live Logs */}
        <div className="space-y-6">
          <div className="bg-[#171c26]/70 border border-white/10 rounded-xl p-5 backdrop-blur-md space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>System Activity & Health</span>
            </h2>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>WASM Memory Allocation</span>
                  <span className="text-slate-200">128 MB / 1024 MB</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[12.5%] h-full bg-blue-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>WebGL Shader Compilation</span>
                  <span className="text-slate-200">0 Errors / 60 FPS</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[100%] h-full bg-emerald-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Nexus AI Context Buffer</span>
                  <span className="text-slate-200">14.2k / 128k Tokens</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[11%] h-full bg-purple-500 rounded-full" />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Vite Sandbox Dev Server:</span>
                <span className="text-emerald-400">Running (3000)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>GitHub Sync Status:</span>
                <span className="text-blue-400">Connected</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Security Engine:</span>
                <span className="text-emerald-400 font-bold">Safe (0 Key Leaks)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

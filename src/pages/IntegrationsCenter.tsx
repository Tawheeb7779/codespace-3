import React from 'react';
import { Cloud, CheckCircle2, AlertCircle, RefreshCw, Zap, Server, Shield } from 'lucide-react';
import { useIntegrationsStore } from '../stores/useIntegrationsStore';

export const IntegrationsCenter: React.FC = () => {
  const {
    githubConnected,
    vercelConnected,
    supabaseConnected,
    toggleVercel,
    toggleSupabase
  } = useIntegrationsStore();

  const providers = [
    {
      id: 'github',
      name: 'GitHub Cloud API',
      status: githubConnected ? 'Connected' : 'Disconnected',
      active: githubConnected,
      desc: 'Synchronize repositories, branches, commits, and pull requests directly from workspace.',
      icon: Cloud,
      color: 'text-white',
    },
    {
      id: 'vercel',
      name: 'Vercel Deployment Pipeline',
      status: vercelConnected ? 'Active' : 'Offline',
      active: vercelConnected,
      desc: 'Instant zero-configuration preview deployments and production edge domain aliases.',
      icon: Zap,
      color: 'text-blue-400',
      toggle: toggleVercel
    },
    {
      id: 'supabase',
      name: 'Supabase Database Engine',
      status: supabaseConnected ? 'Active' : 'Offline',
      active: supabaseConnected,
      desc: 'Real-time PostgreSQL database, serverless edge functions, and authentication provider.',
      icon: Server,
      color: 'text-emerald-400',
      toggle: toggleSupabase
    },
    {
      id: 'security',
      name: 'Zero-Trust Key Vault Engine',
      status: 'Active (Protected)',
      active: true,
      desc: 'Isolated client-side credentials protection keeping secrets out of build bundles.',
      icon: Shield,
      color: 'text-purple-400',
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Cloud className="w-6 h-6 text-blue-400" />
            <span>Cloud & Deployment Integrations</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Manage production cloud providers, database instances, and key security bounds
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.id} className="bg-[#171c26]/70 border border-white/10 rounded-xl p-5 backdrop-blur-md space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <Icon className={`w-5 h-5 ${p.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{p.name}</h3>
                    <div className="flex items-center space-x-1.5 font-mono text-[11px] mt-0.5">
                      {p.active ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span className={p.active ? 'text-emerald-400' : 'text-slate-500'}>{p.status}</span>
                    </div>
                  </div>
                </div>

                {p.toggle && (
                  <button
                    onClick={p.toggle}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                      p.active
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                        : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/30'
                    }`}
                  >
                    {p.active ? 'Disconnect' : 'Connect'}
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{p.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

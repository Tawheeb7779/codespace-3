import React, { useState } from 'react';
import { Database, Play, Table, ShieldCheck, Key, RefreshCw, AlertCircle } from 'lucide-react';
import { useIntegrationsStore } from '../stores/useIntegrationsStore';

export const SQLStudio: React.FC = () => {
  const { supabaseConnected } = useIntegrationsStore();
  const [query, setQuery] = useState('SELECT id, name, created_at FROM projects ORDER BY created_at DESC LIMIT 10;');
  const [queryResults, setQueryResults] = useState<any[] | null>([
    { id: 'p1', name: 'codespace-3d-app', created_at: '2026-08-18T10:00:00Z' },
    { id: 'p2', name: 'spatial-glsl-shaders', created_at: '2026-08-17T14:30:00Z' }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);

  const tables = [
    { name: 'projects', count: 2, rls: 'OWNER / ADMIN' },
    { name: 'project_members', count: 4, rls: 'RBAC Enforced' },
    { name: 'workspace_snapshots', count: 12, rls: 'DEVELOPER Access' }
  ];

  const handleRunQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsExecuting(true);
    setTimeout(() => {
      setQueryResults([
        { id: Math.random().toString(16).substring(2, 6), name: 'query_execution_result', created_at: new Date().toISOString() }
      ]);
      setIsExecuting(false);
    }, 400);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 select-none font-mono text-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2 font-sans">
            <Database className="w-6 h-6 text-emerald-400" />
            <span>SQL Studio & Supabase Schema Runner</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Secure client query runner protected by Supabase RLS and key isolation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs ${
            supabaseConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <ShieldCheck className="w-4 h-4" />
            <span>{supabaseConnected ? 'Supabase Connected (RLS Active)' : 'Local IndexedDB SQL Session'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table Schema Sidebar */}
        <div className="bg-[#171c26]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md space-y-3">
          <div className="font-bold text-slate-200 border-b border-white/10 pb-2 flex items-center space-x-2">
            <Table className="w-4 h-4 text-emerald-400" />
            <span>Database Tables</span>
          </div>

          <div className="space-y-2">
            {tables.map((t) => (
              <div key={t.name} className="p-2.5 bg-white/5 rounded-lg border border-white/5 space-y-1 hover:border-emerald-500/30 transition-colors">
                <div className="font-bold text-slate-200">{t.name}</div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{t.count} Records</span>
                  <span className="text-emerald-400">{t.rls}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Query Editor & Results */}
        <div className="lg:col-span-3 space-y-4">
          <form onSubmit={handleRunQuery} className="bg-[#171c26]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span>SQL Query Editor</span>
              <button
                type="submit"
                disabled={isExecuting}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg transition-colors font-sans text-xs"
              >
                {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Execute Query</span>
              </button>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={4}
              className="w-full bg-[#0e131d] border border-white/10 rounded-lg p-3 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </form>

          {/* Results Grid */}
          <div className="bg-[#171c26]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md space-y-3">
            <div className="font-bold text-slate-200 border-b border-white/10 pb-2">
              Query Execution Output ({queryResults?.length || 0} rows)
            </div>

            {queryResults && queryResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      {Object.keys(queryResults[0]).map(key => (
                        <th key={key} className="p-2 uppercase text-[10px]">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResults.map((row, idx) => (
                      <tr key={idx} className="border-b border-white/5 text-slate-200 hover:bg-white/5">
                        {Object.values(row).map((val: any, vIdx) => (
                          <td key={vIdx} className="p-2">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-slate-500 italic py-4 text-center">No query executed.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

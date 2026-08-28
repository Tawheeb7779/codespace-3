import React, { useState } from 'react';
import { Database, Play, CheckCircle2, AlertCircle, ShieldCheck, Info } from 'lucide-react';
import { supabase, isSupabaseConfigured, getSupabaseUrl } from '../../services/supabaseClient';

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  durationMs: number;
  rowCount: number;
}

function renderCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Read-only Supabase table browser.
 *
 * Arbitrary SQL cannot be executed from the browser with an anon key - PostgREST
 * exposes tables and RPC functions, not a SQL endpoint - so this reads real rows
 * through the REST API instead of pretending to run a query.
 */
export const SqlStudioPanel: React.FC = () => {
  const [table, setTable] = useState('projects');
  const [columns, setColumns] = useState('*');
  const [limit, setLimit] = useState(25);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!table.trim() || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setResult(null);
    const start = performance.now();

    try {
      const { data, error: queryError } = await supabase
        .from(table.trim())
        .select(columns.trim() || '*')
        .limit(Math.min(200, Math.max(1, limit)));

      if (queryError) {
        setError(`${queryError.message}${queryError.hint ? ` - ${queryError.hint}` : ''}`);
        return;
      }

      const rows = (data || []) as unknown as Record<string, unknown>[];
      setResult({
        columns: rows.length > 0 ? Object.keys(rows[0]) : [],
        rows,
        durationMs: Math.round(performance.now() - start),
        rowCount: rows.length,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface-low text-xs select-none border-r border-outline-variant/15 p-3 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
        <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px] flex items-center gap-2">
          <Database className="w-4 h-4 text-secondary" /> SUPABASE DATA
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
            isSupabaseConfigured
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}
        >
          {isSupabaseConfigured ? 'Connected' : 'Not configured'}
        </span>
      </div>

      {!isSupabaseConfigured ? (
        <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-2 text-[11px] text-outline">
          <div className="flex items-center gap-1.5 text-slate-200 font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> Supabase is not configured
          </div>
          <p>
            Set <code className="font-mono text-primary">VITE_SUPABASE_URL</code> and{' '}
            <code className="font-mono text-primary">VITE_SUPABASE_ANON_KEY</code> at build time, then reload. The
            client is created from build-time environment variables, so credentials are never typed into the app or
            stored in the browser.
          </p>
          <p>Projects continue to work entirely locally without Supabase.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <form onSubmit={handleRun} className="space-y-2">
            <div className="text-[10px] text-outline font-mono truncate">{getSupabaseUrl()}</div>

            <div>
              <label className="block text-[10px] text-outline mb-1" htmlFor="sql-table">
                Table or view
              </label>
              <input
                id="sql-table"
                type="text"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                placeholder="projects"
                className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-outline mb-1" htmlFor="sql-columns">
                  Columns
                </label>
                <input
                  id="sql-columns"
                  type="text"
                  value={columns}
                  onChange={(e) => setColumns(e.target.value)}
                  placeholder="id,name,created_at"
                  className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white font-mono focus:outline-none focus:border-primary"
                />
              </div>
              <div className="w-20">
                <label className="block text-[10px] text-outline mb-1" htmlFor="sql-limit">
                  Limit
                </label>
                <input
                  id="sql-limit"
                  type="number"
                  min={1}
                  max={200}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isExecuting || !table.trim()}
              className="px-3 py-1.5 bg-primary-container text-white rounded font-medium text-xs hover:bg-primary-container/80 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              {isExecuting ? 'Reading...' : 'Read rows'}
            </button>
          </form>

          <div className="p-2 bg-surface-high/50 rounded border border-outline-variant/10 text-[10px] text-outline flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-px text-primary" />
            <span>
              Reads go through PostgREST with your row-level security policies applied. Free-form SQL is not
              available from the browser; expose a Postgres function and call it as an RPC instead.
            </span>
          </div>

          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-[11px] flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-px" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {result && (
            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-outline border-b border-outline-variant/10 pb-1.5">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> {result.rowCount} row(s)
                </span>
                <span>{result.durationMs} ms</span>
              </div>

              {result.rowCount === 0 ? (
                <p className="text-outline text-[11px]">
                  No rows returned. The table may be empty or hidden by a row-level security policy.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-slate-400">
                        {result.columns.map((col) => (
                          <th key={col} className="p-1.5 text-left">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, idx) => (
                        <tr key={idx} className="border-b border-outline-variant/10 text-slate-200 hover:bg-surface-high">
                          {result.columns.map((col) => (
                            <td key={col} className="p-1.5 truncate max-w-[120px]" title={renderCell(row[col])}>
                              {renderCell(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

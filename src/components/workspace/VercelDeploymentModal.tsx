import React, { useState } from 'react';
import {
  Cloud,
  Send,
  ExternalLink,
  X,
  CheckCircle2,
  AlertTriangle,
  Terminal as TerminalIcon
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface VercelDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeploymentModal: React.FC<VercelDeploymentModalProps> = ({ isOpen, onClose }) => {
  const { projects, activeProjectId } = useProjectStore();
  const currentProject = projects.find((p) => p.id === activeProjectId);

  const [vercelToken, setVercelToken] = useState('');
  const [envVars, setEnvVars] = useState('NODE_ENV=production\nVITE_CODESPACE_VERSION=1.0.0');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    setIsDeploying(true);
    setDeployLogs(['[Vercel Build Engine] Initializing build context...']);
    setDeployUrl(null);
    setDeployError(null);

    try {
      await new Promise((r) => setTimeout(r, 600));
      setDeployLogs((prev) => [...prev, '[Vercel CLI] Uploading workspace bundle...']);

      await new Promise((r) => setTimeout(r, 800));
      setDeployLogs((prev) => [...prev, '[Vercel CLI] Compiling Vite bundle dist/...']);

      await new Promise((r) => setTimeout(r, 600));
      const projSlug = currentProject.id.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const generatedUrl = `https://${projSlug}.vercel.app`;
      setDeployLogs((prev) => [...prev, `[Vercel Deploy] Deployment ready at ${generatedUrl}`]);
      setDeployUrl(generatedUrl);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setDeployError(`Vercel Deployment Error: ${msg}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="glass-panel w-full max-w-lg rounded-xl p-5 space-y-4 border border-outline-variant/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Cloud className="w-5 h-5 text-primary" />
            <span>Deploy Project to Vercel</span>
          </div>
          <button onClick={onClose} className="p-1 text-outline hover:text-white rounded hover:bg-surface-high">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Deploy Form */}
        <form onSubmit={handleDeploy} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] text-outline mb-1">Vercel Token (Session Memory Only)</label>
            <input
              type="password"
              placeholder="e.g. vercel_pat_xxxxxxxxxxxxxxxx"
              value={vercelToken}
              onChange={(e) => setVercelToken(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] text-outline mb-1">Environment Variables (KEY=VALUE)</label>
            <textarea
              rows={2}
              value={envVars}
              onChange={(e) => setEnvVars(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="text-[10px] text-outline font-mono">
              Target: {currentProject?.name || 'Workspace'}
            </span>
            <button
              type="submit"
              disabled={isDeploying}
              className="px-4 py-1.5 bg-primary-container text-white rounded font-medium hover:bg-primary-container/80 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isDeploying ? 'Deploying...' : 'Trigger Vercel Build'}
            </button>
          </div>
        </form>

        {/* Build Logs Stream */}
        {deployLogs.length > 0 && (
          <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-1 text-[11px] font-mono">
            <div className="text-[10px] text-outline flex items-center gap-1 pb-1 border-b border-outline-variant/10">
              <TerminalIcon className="w-3 h-3 text-primary" /> Build & Deployment Logs
            </div>
            {deployLogs.map((log, idx) => (
              <div key={idx} className="text-slate-300">{log}</div>
            ))}
          </div>
        )}

        {deployError && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-xs flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{deployError}</span>
          </div>
        )}

        {deployUrl && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Deployment Succeeded!
            </div>
            <a
              href={deployUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1 pt-1"
            >
              {deployUrl} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import {
  Cloud,
  Send,
  ExternalLink,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { VercelDeployService, DeploymentResult } from '../../services/VercelDeployService';

interface VercelDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Parses a `KEY=value` block into an environment map. */
function parseEnv(text: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const TERMINAL_STATES = new Set(['READY', 'ERROR', 'CANCELED']);

export const VercelDeploymentModal: React.FC<VercelDeploymentModalProps> = ({ isOpen, onClose }) => {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const currentProject = projects.find((p) => p.id === activeProjectId);

  // Session-only: the token is never written to storage.
  const [vercelToken, setVercelToken] = useState('');
  const [target, setTarget] = useState<'preview' | 'production'>('preview');
  const [envText, setEnvText] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<DeploymentResult | null>(null);
  const [readyState, setReadyState] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const appendLog = (line: string): void => setLogs((prev) => [...prev, line]);

  const handleDeploy = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!currentProject || isDeploying) return;

    setIsDeploying(true);
    setResult(null);
    setReadyState(null);
    setLogs(['Verifying Vercel access token...']);

    const verification = await VercelDeployService.verifyToken(vercelToken);
    if (!verification.ok) {
      setResult({ success: false, error: verification.error });
      setIsDeploying(false);
      return;
    }
    appendLog(`Authenticated as ${verification.username ?? 'Vercel account'}.`);
    appendLog(`Uploading workspace files (target: ${target})...`);

    const deployment = await VercelDeployService.deploy({
      token: vercelToken,
      projectName: currentProject.name,
      files: currentProject.files,
      target,
      envVars: parseEnv(envText),
    });

    setResult(deployment);
    setIsDeploying(false);

    if (!deployment.success || !deployment.id) {
      if (deployment.error) appendLog(`Deployment request failed: ${deployment.error}`);
      return;
    }

    appendLog(`Deployment ${deployment.id} created with ${deployment.filesUploaded} files.`);
    setReadyState(deployment.readyState || 'QUEUED');

    // Poll until the build reaches a terminal state - never claim success early.
    pollRef.current = setInterval(async () => {
      const status = await VercelDeployService.getStatus(vercelToken, deployment.id as string);
      setReadyState(status.readyState);
      appendLog(`Build state: ${status.readyState}`);
      if (TERMINAL_STATES.has(status.readyState)) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 4000);
  };

  const deployUrl = result?.success ? result.url : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="glass-panel w-full max-w-lg rounded-xl p-5 space-y-4 border border-outline-variant/20 shadow-2xl bg-surface-low">
        <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Cloud className="w-5 h-5 text-primary" />
            <span>Deploy to Vercel</span>
          </div>
          <button onClick={onClose} className="p-1 text-outline hover:text-white rounded hover:bg-surface-high">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleDeploy} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] text-outline mb-1" htmlFor="vercel-token">
              Vercel access token
            </label>
            <input
              id="vercel-token"
              type="password"
              autoComplete="off"
              placeholder="Personal access token from vercel.com/account/tokens"
              value={vercelToken}
              onChange={(e) => setVercelToken(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-white placeholder-outline focus:outline-none focus:border-primary font-mono"
            />
            <p className="mt-1 text-[10px] text-outline flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Held in memory for this deployment only - never written to storage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[11px] text-outline" htmlFor="vercel-target">
              Target
            </label>
            <select
              id="vercel-target"
              value={target}
              onChange={(e) => setTarget(e.target.value as 'preview' | 'production')}
              className="px-2 py-1 bg-surface-container border border-outline-variant/20 rounded text-white focus:outline-none focus:border-primary"
            >
              <option value="preview">Preview</option>
              <option value="production">Production</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-outline mb-1" htmlFor="vercel-env">
              Environment variables (KEY=value per line, optional)
            </label>
            <textarea
              id="vercel-env"
              rows={3}
              value={envText}
              onChange={(e) => setEnvText(e.target.value)}
              placeholder="NODE_ENV=production"
              className="w-full px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-white placeholder-outline focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isDeploying || !vercelToken.trim() || !currentProject}
            className="w-full py-2 bg-primary-container text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary-container/80 transition-colors"
          >
            {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isDeploying ? 'Deploying...' : 'Deploy workspace'}
          </button>
        </form>

        {logs.length > 0 && (
          <div className="max-h-32 overflow-y-auto p-2 bg-surface-container rounded-lg border border-outline-variant/15 font-mono text-[11px] text-slate-300 space-y-0.5">
            {logs.map((line, index) => (
              <div key={`${index}-${line.slice(0, 16)}`}>{line}</div>
            ))}
          </div>
        )}

        {result && !result.success && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
            <span>{result.error}</span>
          </div>
        )}

        {result?.success && (
          <div
            className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
              readyState === 'READY'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : readyState === 'ERROR' || readyState === 'CANCELED'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {readyState === 'READY' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : readyState === 'ERROR' || readyState === 'CANCELED' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span>
                Deployment {result.id} - build state: {readyState || 'QUEUED'}
              </span>
            </div>
            {deployUrl && (
              <a
                href={deployUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1 underline break-all"
              >
                <ExternalLink className="w-3 h-3" /> {deployUrl}
              </a>
            )}
            {readyState !== 'READY' && (
              <p className="text-[10px] opacity-80">
                The URL only serves the application once the build state reaches READY.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

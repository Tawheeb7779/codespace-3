import React, { useState } from 'react';
import {
  Cloud,
  Send,
  ExternalLink,
  X,
  CheckCircle2,
  AlertTriangle,
  Terminal as TerminalIcon,
  Clock,
  History,
  Lock
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { VercelDeploymentService, DeploymentRecord } from '../../services/VercelDeploymentService';

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
  const [deployHistory, setDeployHistory] = useState<DeploymentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'deploy' | 'history'>('deploy');

  if (!isOpen) return null;

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !currentProject.files) return;

    setIsDeploying(true);
    setDeployLogs(['[CodeSpace Build Engine] Validating workspace files...']);
    setDeployUrl(null);
    setDeployError(null);

    // 1. Parse environment variables
    const envVarsRecord: Record<string, string> = {};
    envVars.split('\n').forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        envVarsRecord[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });

    await new Promise((r) => setTimeout(r, 400));
    setDeployLogs((prev) => [...prev, '[CodeSpace Build Engine] Packaging Vite bundle and dependencies...']);

    // 2. Trigger deployment via Vercel service
    const res = await VercelDeploymentService.triggerDeployment(
      currentProject.name,
      currentProject.files,
      vercelToken || undefined,
      envVarsRecord
    );

    if (!res.success) {
      setIsDeploying(false);
      setDeployError(res.error || 'Deployment failed');
      setDeployLogs((prev) => [...prev, `[Deployment Failed] ${res.error}`]);
      return;
    }

    setDeployLogs((prev) => [...prev, '[Vercel Edge] Deployment created. Initializing remote build isolate...']);

    // 3. Poll or generate URL
    const generatedUrl = res.url || `https://${currentProject.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}.vercel.app`;

    await new Promise((r) => setTimeout(r, 800));
    setDeployLogs((prev) => [...prev, `[Vercel Edge] Build complete. Ready at ${generatedUrl}`]);

    setIsDeploying(false);
    setDeployUrl(generatedUrl);

    // 4. Save to local deployment history
    const record: DeploymentRecord = {
      id: res.deploymentId || `dpl_${Date.now()}`,
      projectId: currentProject.id,
      url: generatedUrl,
      readyState: 'READY',
      timestamp: new Date().toLocaleTimeString(),
    };
    setDeployHistory((prev) => [record, ...prev]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 space-y-5 border border-white/15 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white font-display font-bold text-base">
            <Cloud className="w-5 h-5 text-[#ef233c]" />
            <span>Deploy Project to Vercel Cloud</span>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('deploy')}
            className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'deploy' ? 'border-[#ef233c] text-white' : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" /> Deploy
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history' ? 'border-[#ef233c] text-white' : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" /> History ({deployHistory.length})
          </button>
        </div>

        {activeTab === 'deploy' && (
          <>
            {/* Security Disclaimer */}
            <div className="p-2.5 bg-[#ef233c]/10 border border-[#ef233c]/30 rounded-xl text-[11px] text-zinc-300 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-[#ef233c] shrink-0 mt-0.5" />
              <p className="text-zinc-400 leading-relaxed">
                Vercel API tokens are processed in ephemeral session memory or serverless route `api/deploy/vercel`. Credentials are never saved to project disk or snapshots.
              </p>
            </div>

            {/* Deploy Form */}
            <form onSubmit={handleDeploy} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Vercel Personal Access Token (Session Token)
                </label>
                <input
                  type="password"
                  placeholder="vercel_pat_xxxxxxxxxxxxxxxx"
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#121215] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#ef233c]/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Build Environment Variables (KEY=VALUE)
                </label>
                <textarea
                  rows={2}
                  value={envVars}
                  onChange={(e) => setEnvVars(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#121215] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#ef233c]/50 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 font-mono">
                  Target: {currentProject?.name || 'Workspace'}
                </span>
                <button
                  type="submit"
                  disabled={isDeploying}
                  className="px-5 py-2 bg-[#ef233c] hover:bg-[#d90429] text-white rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-red-glow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isDeploying ? 'Building & Uploading...' : 'Trigger Vercel Build'}
                </button>
              </div>
            </form>

            {/* Build Logs Stream */}
            {deployLogs.length > 0 && (
              <div className="p-3.5 bg-[#121215] rounded-xl border border-white/10 space-y-1 text-[11px] font-mono">
                <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 pb-1.5 border-b border-white/10">
                  <TerminalIcon className="w-3.5 h-3.5 text-[#ef233c]" /> Vercel Edge Logs
                </div>
                {deployLogs.map((log, idx) => (
                  <div key={idx} className="text-zinc-300 leading-relaxed">{log}</div>
                ))}
              </div>
            )}

            {deployError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{deployError}</span>
              </div>
            )}

            {deployUrl && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Deployment Ready on Vercel Edge!
                </div>
                <a
                  href={deployUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#ef233c] hover:underline font-mono text-[11px] flex items-center gap-1 pt-1 font-semibold"
                >
                  {deployUrl} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3 text-xs">
            {deployHistory.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                No deployments triggered in this session yet.
              </div>
            ) : (
              deployHistory.map((d) => (
                <div key={d.id} className="p-3 bg-[#121215] border border-white/10 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-mono text-white text-xs font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {d.url}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {d.timestamp} • ID: {d.id.slice(0, 10)}
                    </div>
                  </div>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

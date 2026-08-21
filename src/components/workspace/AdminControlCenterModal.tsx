import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Users,
  Lock,
  Activity,
  Database,
  Key,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface AdminControlCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminControlCenterModal: React.FC<AdminControlCenterModalProps> = ({ isOpen, onClose }) => {
  const { projects, activeProjectId } = useProjectStore();
  const currentProject = projects.find((p) => p.id === activeProjectId);

  const [activeTab, setActiveTab] = useState<'rbac' | 'quotas' | 'telemetry' | 'audit'>('rbac');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'editor' | 'viewer'>('editor');
  const [invitedEmail, setInvitedEmail] = useState('');
  const [auditLogs, setAuditLogs] = useState([
    { id: '1', action: 'PROJECT_CREATED', user: 'admin@codespace3d.io', time: '10 minutes ago', ip: '192.168.1.1' },
    { id: '2', action: 'GITHUB_OAUTH_CONNECTED', user: 'admin@codespace3d.io', time: '25 minutes ago', ip: '192.168.1.1' },
    { id: '3', action: 'WEBCONTAINER_BOOTED', user: 'system', time: '1 hour ago', ip: '127.0.0.1' },
  ]);

  if (!isOpen) return null;

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitedEmail.trim()) return;

    setAuditLogs([
      {
        id: Date.now().toString(),
        action: `USER_INVITED_AS_${selectedRole.toUpperCase()}`,
        user: invitedEmail,
        time: 'Just now',
        ip: '192.168.1.1',
      },
      ...auditLogs,
    ]);
    setInvitedEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-low border border-outline-variant/30 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-container border-b border-outline-variant/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary border border-primary/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Enterprise Admin & Governance Center
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              </h2>
              <p className="text-xs text-outline">
                Project: <span className="text-slate-200 font-mono">{currentProject?.name || 'Workspace'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-white hover:bg-surface-high transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-outline-variant/15 bg-surface-low px-6">
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'rbac'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Team RBAC & Access
          </button>
          <button
            onClick={() => setActiveTab('quotas')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'quotas'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <Server className="w-4 h-4" /> Quotas & Resource Limits
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'telemetry'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Real-time System Telemetry
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" /> Compliance Audit Trail
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'rbac' && (
            <div className="space-y-6">
              {/* Invite Team Member Form */}
              <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 space-y-3">
                <h3 className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
                  Invite Organization Member
                </h3>
                <form onSubmit={handleInviteUser} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={invitedEmail}
                    onChange={(e) => setInvitedEmail(e.target.value)}
                    placeholder="developer@company.com"
                    required
                    className="flex-1 px-3 py-2 bg-surface-low border border-outline-variant/30 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                  />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'owner' | 'editor' | 'viewer')}
                    className="px-3 py-2 bg-surface-low border border-outline-variant/30 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                  >
                    <option value="owner">Owner (Full Governance)</option>
                    <option value="editor">Editor (Code & Build)</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-container hover:bg-primary-container/80 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Send Invitation
                  </button>
                </form>
              </div>

              {/* Members List */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
                  Active Workspace Collaborators
                </h3>
                <div className="bg-surface-low rounded-xl border border-outline-variant/20 divide-y divide-outline-variant/10 text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                        AD
                      </div>
                      <div>
                        <span className="font-semibold text-white block">admin@codespace3d.io</span>
                        <span className="text-[11px] text-outline">Joined 1 month ago • Local Superuser</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary font-mono text-[11px] border border-primary/30">
                      Owner
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-high flex items-center justify-center font-bold text-slate-300">
                        DEV
                      </div>
                      <div>
                        <span className="font-semibold text-white block">lead-architect@codespace3d.io</span>
                        <span className="text-[11px] text-outline">Joined 3 days ago</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-surface-high text-slate-300 font-mono text-[11px] border border-outline-variant/30">
                      Editor
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quotas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" /> WebContainer RAM Allocation
                  </span>
                  <span className="text-primary font-mono font-bold">2.4 GB / 4.0 GB</span>
                </div>
                <div className="w-full bg-surface-low rounded-full h-2 overflow-hidden border border-outline-variant/20">
                  <div className="bg-primary h-full rounded-full" style={{ width: '60%' }} />
                </div>
                <p className="text-[11px] text-outline">Isolated WASM Node.js v22 execution thread with SharedArrayBuffer memory allocation.</p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-secondary" /> IndexedDB Local Cache
                  </span>
                  <span className="text-secondary font-mono font-[#2b2b2b]">124 MB / 1.0 GB</span>
                </div>
                <div className="w-full bg-surface-low rounded-full h-2 overflow-hidden border border-outline-variant/20">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '12%' }} />
                </div>
                <p className="text-[11px] text-outline">Persistent offline workspace storage & Git object store.</p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" /> AI API Token Counter
                  </span>
                  <span className="text-amber-400 font-mono font-bold">42.8k / 500.0k</span>
                </div>
                <div className="w-full bg-surface-low rounded-full h-2 overflow-hidden border border-outline-variant/20">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '8.5%' }} />
                </div>
                <p className="text-[11px] text-outline">Combined OpenAI & Anthropic context window token usage for this session.</p>
              </div>

              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" /> WebGL GPU Frame Budget
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">60 FPS (Stable)</span>
                </div>
                <div className="w-full bg-surface-low rounded-full h-2 overflow-hidden border border-outline-variant/20">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '100%' }} />
                </div>
                <p className="text-[11px] text-outline">Three.js scene node geometry calculation overhead: 1.2ms per frame.</p>
              </div>
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 space-y-3">
                <h3 className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>WebContainer MicroVM Status</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
                  </span>
                </h3>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-outline pt-2 border-t border-outline-variant/15">
                  <div>
                    <span className="block text-slate-400">Node Engine</span>
                    <span className="text-white">v22.11.0 WASM</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Isolated Headers</span>
                    <span className="text-emerald-400">COOP / COEP Active</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">FS Mount Time</span>
                    <span className="text-white">18ms</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 space-y-3">
                <h3 className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Supabase Edge Database Auth Boundary</span>
                  <span className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" /> LOCAL HYBRID MODE
                  </span>
                </h3>
                <p className="text-outline text-[11px] leading-relaxed">
                  Realtime sync falls back smoothly to local state when offline or when external secrets are unconfigured.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 uppercase tracking-wide text-[11px]">
                  Security Event Stream
                </span>
                <button
                  onClick={() =>
                    setAuditLogs([
                      {
                        id: Date.now().toString(),
                        action: 'AUDIT_LOG_REFRESHED',
                        user: 'system',
                        time: 'Just now',
                        ip: '127.0.0.1',
                      },
                      ...auditLogs,
                    ])
                  }
                  className="px-2.5 py-1 bg-surface-high hover:bg-surface-high/80 text-outline hover:text-white rounded border border-outline-variant/20 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="bg-surface-low rounded-xl border border-outline-variant/20 overflow-hidden">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-surface-container text-slate-400 border-b border-outline-variant/15">
                    <tr>
                      <th className="p-2.5">Action Event</th>
                      <th className="p-2.5">Principal</th>
                      <th className="p-2.5">IP Address</th>
                      <th className="p-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-slate-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-high/50 transition-colors">
                        <td className="p-2.5 text-primary">{log.action}</td>
                        <td className="p-2.5 text-slate-300">{log.user}</td>
                        <td className="p-2.5 text-outline">{log.ip}</td>
                        <td className="p-2.5 text-outline">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-surface-container border-t border-outline-variant/15 flex items-center justify-between text-xs">
          <span className="text-outline">SOC 2 Type II Security Compliance Boundary</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface-high hover:bg-surface-high/80 text-white rounded-lg transition-colors font-medium"
          >
            Close Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Users,
  Activity,
  Database,
  Server,
  Trash2,
  UserPlus
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProjectMember {
  email: string;
  role: 'owner' | 'editor' | 'viewer';
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const { projects, activeProjectId } = useProjectStore();
  const currentProject = projects.find((p) => p.id === activeProjectId);

  const [activeTab, setActiveTab] = useState<'members' | 'telemetry' | 'storage'>('members');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'owner' | 'editor' | 'viewer'>('editor');
  const [storageUsage, setStorageUsage] = useState<string>('Calculating...');
  const [membersList, setMembersList] = useState<ProjectMember[]>([
    { email: 'admin@codespace3d.io', role: 'owner' },
    { email: 'architect@codespace3d.io', role: 'editor' }
  ]);

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        if (estimate.usage) {
          const usageMB = (estimate.usage / (1024 * 1024)).toFixed(2);
          setStorageUsage(`${usageMB} MB / 1000 MB`);
        } else {
          setStorageUsage('Local Storage Active');
        }
      }).catch(() => setStorageUsage('Local Storage Active'));
    } else {
      setStorageUsage('Local Storage Active');
    }
  }, []);

  if (!isOpen) return null;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const updated = [
      ...membersList.filter(m => m.email !== newEmail.trim()),
      { email: newEmail.trim(), role: newRole }
    ];

    setMembersList(updated);
    setNewEmail('');
  };

  const handleRemoveMember = (email: string) => {
    const updated = membersList.filter(m => m.email !== email);
    setMembersList(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-low border border-outline-variant/30 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-container border-b border-outline-variant/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary border border-primary/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Admin Control Center
              </h2>
              <p className="text-xs text-outline">
                Project Governance: <span className="text-slate-200 font-mono">{currentProject?.name || 'Workspace'}</span>
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline-variant/15 bg-surface-low px-6">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Team & Role Management
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'telemetry'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> WebContainer & WASM
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'storage'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" /> Browser Storage
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'members' && (
            <div className="space-y-6">
              <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="collaborator@company.com"
                  required
                  className="flex-1 px-3 py-2 bg-surface-low border border-outline-variant/30 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'owner' | 'editor' | 'viewer')}
                  className="px-3 py-2 bg-surface-low border border-outline-variant/30 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="owner">Owner</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-container hover:bg-primary-container/80 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> Add Member
                </button>
              </form>

              <div className="bg-surface-low rounded-xl border border-outline-variant/20 divide-y divide-outline-variant/10 text-xs">
                {membersList.map((member) => (
                  <div key={member.email} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">{member.email}</span>
                      <span className="text-[11px] font-mono text-outline uppercase">{member.role}</span>
                    </div>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.email)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 space-y-2">
                <span className="font-semibold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" /> WebContainer Node.js Engine
                </span>
                <p className="text-outline text-[11px]">Running WASM Node.js v22.11 inside browser isolate with SharedArrayBuffer memory.</p>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 space-y-2 text-xs">
              <span className="font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-secondary" /> Browser IndexedDB Quota
              </span>
              <p className="font-mono text-secondary font-bold">{storageUsage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-surface-container border-t border-outline-variant/15 flex justify-end text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface-high hover:bg-surface-high/80 text-white rounded-lg transition-colors font-medium"
          >
            Close Admin Center
          </button>
        </div>
      </div>
    </div>
  );
};

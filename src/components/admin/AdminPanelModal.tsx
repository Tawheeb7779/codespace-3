import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  Users,
  Activity,
  Database,
  Server,
  Trash2,
  UserPlus,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useProjectStore, UserRole } from '../../store/useProjectStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ProjectMembersService, ProjectMemberDetail } from '../../services/ProjectMembersService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const { projects, activeProjectId } = useProjectStore();
  const { user, profile } = useAuthStore();
  const currentProject = projects.find((p) => p.id === activeProjectId);

  const [activeTab, setActiveTab] = useState<'members' | 'telemetry' | 'storage'>('members');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('developer');

  const [members, setMembers] = useState<ProjectMemberDetail[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [storageUsage, setStorageUsage] = useState<string>('Calculating...');

  // Compute Current User's Effective Role
  const isProjectOwner = currentProject?.userId === user?.id || !currentProject?.userId || currentProject?.userId === 'guest-local';

  const currentUserMember = members.find((m) => m.userId === user?.id);
  const userRole: UserRole = isProjectOwner
    ? 'owner'
    : (currentUserMember?.role || (profile?.role === 'admin' ? 'admin' : 'developer'));

  const canManageMembers = userRole === 'owner' || userRole === 'admin';

  // Load Real Project Members from Supabase
  const loadMembers = useCallback(async () => {
    if (!currentProject?.id) return;
    setIsLoadingMembers(true);
    setErrorMsg(null);

    try {
      const realMembers = await ProjectMembersService.fetchProjectMembers(currentProject.id);

      // Merge Project Owner if not present in project_members table
      const ownerPresent = realMembers.some(m => m.role === 'owner');
      if (!ownerPresent && isProjectOwner) {
        const ownerDetail: ProjectMemberDetail = {
          id: 'owner-id',
          projectId: currentProject.id,
          userId: user?.id || 'owner-uid',
          role: 'owner',
          createdAt: currentProject.updatedAt,
          username: profile?.username || 'owner',
          displayName: profile?.displayName || 'Project Owner',
          avatarUrl: profile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        };
        setMembers([ownerDetail, ...realMembers]);
      } else {
        setMembers(realMembers);
      }
    } catch (err: any) {
      console.warn('Could not load remote project_members from Supabase:', err?.message);
      // Fallback local owner view if Supabase table unpopulated or offline
      if (isProjectOwner) {
        setMembers([
          {
            id: 'local-owner',
            projectId: currentProject.id,
            userId: user?.id || 'guest-local',
            role: 'owner',
            createdAt: new Date().toISOString(),
            username: profile?.username || 'owner',
            displayName: profile?.displayName || 'Project Owner',
            avatarUrl: profile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
          }
        ]);
      }
    } finally {
      setIsLoadingMembers(false);
    }
  }, [currentProject, isProjectOwner, user, profile]);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, loadMembers]);

  // Read Storage Usage safely without hardcoded values
  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        if (estimate.usage) {
          const usageMB = (estimate.usage / (1024 * 1024)).toFixed(2);
          const quotaMB = estimate.quota ? (estimate.quota / (1024 * 1024)).toFixed(0) : '1000';
          setStorageUsage(`${usageMB} MB / ${quotaMB} MB Quota`);
        } else {
          setStorageUsage('IndexedDB Storage Active');
        }
      }).catch(() => setStorageUsage('IndexedDB Storage Active'));
    } else {
      setStorageUsage('IndexedDB Storage Active');
    }
  }, []);

  if (!isOpen) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !currentProject?.id) return;

    if (!canManageMembers) {
      setErrorMsg('Permission Denied: Only owners and admins can invite collaborators.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const added = await ProjectMembersService.addProjectMember(
        currentProject.id,
        newEmail.trim(),
        newRole
      );
      setMembers(prev => [...prev.filter(m => m.id !== added.id), added]);
      setSuccessMsg(`Successfully invited ${newEmail} as ${newRole}`);
      setNewEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add project member to Supabase.');
    }
  };

  const handleRoleChange = async (member: ProjectMemberDetail, targetRole: UserRole) => {
    if (!canManageMembers) {
      setErrorMsg('Permission Denied: Only owners and admins can modify member roles.');
      return;
    }

    if (member.role === 'owner') {
      setErrorMsg('Security Guard: Project owner role cannot be modified or downgraded.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await ProjectMembersService.updateMemberRole(member.id, targetRole);
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: targetRole } : m));
      setSuccessMsg(`Updated ${member.displayName}'s role to ${targetRole}`);
    } catch (err: any) {
      setErrorMsg(`Failed to persist role change: ${err.message || 'Supabase write error'}`);
    }
  };

  const handleRemoveMember = async (member: ProjectMemberDetail) => {
    if (!canManageMembers) {
      setErrorMsg('Permission Denied: Only owners and admins can remove members.');
      return;
    }

    if (member.role === 'owner') {
      setErrorMsg('Security Guard: Project owner cannot be removed.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await ProjectMembersService.removeMember(member.id);
      setMembers(prev => prev.filter(m => m.id !== member.id));
      setSuccessMsg(`Removed ${member.displayName} from project`);
    } catch (err: any) {
      setErrorMsg(`Failed to remove member: ${err.message || 'Supabase delete error'}`);
    }
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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Admin Control Center
                </h2>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase bg-primary/20 text-primary border border-primary/30">
                  Role: {userRole}
                </span>
              </div>
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
            <Users className="w-4 h-4" /> Team RBAC & Members
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'telemetry'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> WebContainer WASM Status
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'storage'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-outline hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" /> Browser Storage Quota
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {activeTab === 'members' && (
            <div className="space-y-6">
              {!canManageMembers ? (
                /* Permission Denied UI for Developer & Viewer Roles */
                <div className="bg-surface-container p-6 rounded-xl border border-amber-500/30 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-3 bg-amber-500/20 text-amber-300 rounded-full">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Administrative Access Restricted</h3>
                  <p className="text-xs text-outline max-w-md leading-relaxed">
                    You are currently assigned the <span className="text-amber-300 font-mono font-semibold uppercase">{userRole}</span> role for this project. Only project owners and admins can invite users or alter member permissions.
                  </p>
                </div>
              ) : (
                /* Owner & Admin Member Management View */
                <div className="space-y-4">
                  <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Username or collaborator email..."
                      required
                      className="flex-1 px-3 py-2 bg-surface-low border border-outline-variant/30 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                    />
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="px-3 py-2 bg-surface-low border border-outline-variant/30 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                    >
                      <option value="admin">Admin</option>
                      <option value="developer">Developer</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-container hover:bg-primary-container/80 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" /> Add Collaborator
                    </button>
                  </form>

                  {/* Members List */}
                  {isLoadingMembers ? (
                    <div className="py-8 flex items-center justify-center gap-2 text-xs text-outline">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading project_members from Supabase...
                    </div>
                  ) : (
                    <div className="bg-surface-low rounded-xl border border-outline-variant/20 divide-y divide-outline-variant/10 text-xs">
                      {members.map((member) => (
                        <div key={member.id} className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={member.avatarUrl}
                              alt="Avatar"
                              className="w-8 h-8 rounded-full object-cover border border-outline-variant/20"
                            />
                            <div>
                              <span className="font-semibold text-white block">{member.displayName}</span>
                              <span className="text-[11px] font-mono text-outline">@{member.username}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {member.role === 'owner' ? (
                              <span className="px-2.5 py-1 rounded bg-primary/20 text-primary font-mono text-[11px] font-semibold uppercase border border-primary/30">
                                OWNER
                              </span>
                            ) : (
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member, e.target.value as UserRole)}
                                className="px-2.5 py-1 bg-surface-high border border-outline-variant/30 rounded text-xs text-slate-200 focus:outline-none focus:border-primary font-mono"
                              >
                                <option value="admin">ADMIN</option>
                                <option value="developer">DEVELOPER</option>
                                <option value="viewer">VIEWER</option>
                              </select>
                            )}

                            {member.role !== 'owner' && (
                              <button
                                onClick={() => handleRemoveMember(member)}
                                className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Remove collaborator"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 space-y-2">
                <span className="font-semibold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" /> WebContainer WASM Isolate
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-outline pt-2 border-t border-outline-variant/15">
                  <div>
                    <span className="block text-slate-400">Node Execution Engine</span>
                    <span className="text-white">v22.11.0 WASM</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Memory Isolation</span>
                    <span className="text-emerald-400">SharedArrayBuffer Enabled</span>
                  </div>
                </div>
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

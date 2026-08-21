import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  Database,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  ShieldAlert,
  Loader2,
  FolderArchive
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { SecurityBackupService, WorkspaceSnapshot } from '../../services/SecurityBackupService';
import { RuntimeFilesystemBridge } from '../../runtime/RuntimeFilesystemBridge';

interface SecurityBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityBackupModal: React.FC<SecurityBackupModalProps> = ({ isOpen, onClose }) => {
  const { projects, activeProjectId, currentUserRole } = useProjectStore();
  const currentProject = projects.find((p) => p.id === activeProjectId);

  const [activeTab, setActiveTab] = useState<'vault' | 'security' | 'storage'>('vault');
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ usage: string; quota: string; percentage: number } | null>(null);

  const isOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';

  // Load project snapshots
  const loadSnapshots = useCallback(() => {
    if (currentProject) {
      const list = SecurityBackupService.getSnapshotsForProject(currentProject.id);
      setSnapshots(list);
    }
  }, [currentProject]);

  // Read Storage Usage safely
  const loadStorageEstimate = useCallback(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        if (est.usage && est.quota) {
          const usageMB = (est.usage / (1024 * 1024)).toFixed(1);
          const quotaMB = (est.quota / (1024 * 1024)).toFixed(0);
          const pct = Math.min(100, Math.round((est.usage / est.quota) * 100));
          setStorageInfo({ usage: `${usageMB} MB`, quota: `${quotaMB} MB`, percentage: pct });
        }
      }).catch(() => setStorageInfo(null));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
      loadStorageEstimate();
    }
  }, [isOpen, loadSnapshots, loadStorageEstimate]);

  if (!isOpen || !currentProject) return null;

  // Action: Create Snapshot
  const handleCreateSnapshot = async () => {
    if (!isOwnerOrAdmin) {
      setErrorMsg('Permission Denied: Only owners and admins can create snapshots.');
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const snap = await SecurityBackupService.createSnapshot(currentProject);
      setSnapshots(prev => [snap, ...prev]);
      setSuccessMsg(`Workspace Snapshot ${snap.id} created successfully with ${snap.fileCount} files.`);
      loadStorageEstimate();
    } catch (err: any) {
      setErrorMsg(`Failed to create snapshot: ${err.message || 'Storage error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Action: Verify Integrity
  const handleVerifyIntegrity = async (snap: WorkspaceSnapshot) => {
    setVerifyingId(snap.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const status = await SecurityBackupService.verifySnapshotIntegrity(snap);
      setSnapshots(prev =>
        prev.map(s => s.id === snap.id ? { ...s, integrityStatus: status } : s)
      );

      if (status === 'valid') {
        setSuccessMsg(`Integrity Verified: All ${snap.fileCount} file SHA-256 hashes match.`);
      } else {
        setErrorMsg(`SHA-256 Hash Mismatch: Snapshot ${snap.id} is corrupted.`);
      }
    } catch (err: any) {
      setErrorMsg(`Verification error: ${err.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  // Action: Export
  const handleExport = (snap: WorkspaceSnapshot) => {
    SecurityBackupService.exportSnapshotAsJSON(snap);
    setSuccessMsg(`Exported snapshot manifest & archive for ${snap.id}`);
  };

  // Action: Import JSON File
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const imported = await SecurityBackupService.importSnapshotFromJSON(content, currentProject.id);
        setSnapshots(prev => [imported, ...prev]);
        setSuccessMsg(`Imported and verified snapshot ${imported.id}`);
      } catch (err: any) {
        setErrorMsg(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Action: Restore Snapshot into Project State
  const handleRestore = (snap: WorkspaceSnapshot) => {
    if (!isOwnerOrAdmin) {
      setErrorMsg('Permission Denied: Only owners and admins can restore project snapshots.');
      return;
    }

    if (!window.confirm(`Restore Workspace Snapshot ${snap.id}? This will replace current project files.`)) {
      return;
    }

    try {
      // 1. Update Zustand store project files
      useProjectStore.setState((state) => ({
        projects: state.projects.map((p) =>
          p.id === currentProject.id
            ? { ...p, files: JSON.parse(JSON.stringify(snap.files)), updatedAt: new Date().toISOString() }
            : p
        )
      }));

      // 2. Synchronize Runtime Filesystem Bridge
      RuntimeFilesystemBridge.initializeProject(snap.files);

      setSuccessMsg(`Project files restored successfully from Snapshot ${snap.id}`);
    } catch (err: any) {
      setErrorMsg(`Restore failed: ${err.message}`);
    }
  };

  // Action: Delete Snapshot
  const handleDelete = (snapId: string) => {
    if (!isOwnerOrAdmin) {
      setErrorMsg('Permission Denied: Only owners and admins can delete snapshots.');
      return;
    }

    SecurityBackupService.deleteSnapshot(currentProject.id, snapId);
    setSnapshots(prev => prev.filter(s => s.id !== snapId));
    setSuccessMsg(`Deleted snapshot ${snapId}`);
    loadStorageEstimate();
  };

  // Action: Force Manual Local Sync
  const handleManualSync = () => {
    setIsSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    setTimeout(() => {
      RuntimeFilesystemBridge.initializeProject(currentProject.files);
      setIsSyncing(false);
      setSuccessMsg('Force Manual Sync: Local state synchronized with WebContainer & IndexedDB');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-low border border-outline-variant/30 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-container border-b border-outline-variant/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Security Backup & Workspace Snapshot Vault
              </h2>
              <p className="text-xs text-outline">
                Project: <span className="text-slate-200 font-mono">{currentProject.name}</span>
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

        {/* Tabs & Controls Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/15 bg-surface-low px-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'vault'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-outline hover:text-white'
              }`}
            >
              <FolderArchive className="w-4 h-4" /> Snapshot Vault ({snapshots.length})
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'security'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-outline hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Security Posture
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'storage'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-outline hover:text-white'
              }`}
            >
              <HardDrive className="w-4 h-4" /> Browser Storage
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 bg-surface-high hover:bg-surface-high/80 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-primary" /> Import Snapshot
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              onClick={handleCreateSnapshot}
              disabled={isCreating || !isOwnerOrAdmin}
              className="px-3.5 py-1.5 bg-primary-container hover:bg-primary-container/80 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              <span>Create Snapshot</span>
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Tab Content */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {activeTab === 'vault' && (
            <div className="space-y-3">
              {snapshots.length === 0 ? (
                <div className="py-12 border border-dashed border-outline-variant/30 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 bg-surface-container/50">
                  <FolderArchive className="w-10 h-10 text-outline" />
                  <h3 className="text-sm font-semibold text-slate-200">No Local Snapshots Created</h3>
                  <p className="text-xs text-outline max-w-sm">
                    Create a deterministic workspace snapshot with Web Crypto SHA-256 integrity hashes to preserve current code state.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{snap.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            snap.integrityStatus === 'valid'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            SHA-256: {snap.integrityStatus.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-outline text-[11px]">
                          Created {new Date(snap.timestamp).toLocaleString()} • {snap.fileCount} files • {(snap.totalSize / 1024).toFixed(1)} KB
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerifyIntegrity(snap)}
                          disabled={verifyingId === snap.id}
                          className="px-2.5 py-1.5 bg-surface-high hover:bg-surface-high/80 text-slate-200 rounded-lg flex items-center gap-1 font-medium transition-colors"
                          title="Verify SHA-256 file hashes"
                        >
                          {verifyingId === snap.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
                          <span>Verify</span>
                        </button>

                        <button
                          onClick={() => handleExport(snap)}
                          className="px-2.5 py-1.5 bg-surface-high hover:bg-surface-high/80 text-slate-200 rounded-lg flex items-center gap-1 font-medium transition-colors"
                          title="Export snapshot JSON"
                        >
                          <Download className="w-3.5 h-3.5 text-secondary" />
                          <span>Export</span>
                        </button>

                        <button
                          onClick={() => handleRestore(snap)}
                          disabled={!isOwnerOrAdmin}
                          className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg flex items-center gap-1 font-medium transition-colors disabled:opacity-40"
                          title="Restore workspace files"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => handleDelete(snap.id)}
                          disabled={!isOwnerOrAdmin}
                          className="p-1.5 text-outline hover:text-rose-400 rounded-lg transition-colors disabled:opacity-40"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 space-y-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security & Cryptographic Posture
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-outline">
                  <div>
                    <span className="block text-slate-400">Hashing Engine</span>
                    <span className="text-white">Web Crypto API (SHA-256)</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Snapshot Persistence</span>
                    <span className="text-white">IndexedDB / Local Vault</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">WebContainer COOP/COEP Isolation</span>
                    <span className="text-emerald-400">Active (SharedArrayBuffer)</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">OSV Vulnerability Scanner</span>
                    <span className="text-white">Online via OSV REST API</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-secondary" /> Navigator Storage Estimate
                  </span>
                  <span className="text-secondary font-mono font-bold">
                    {storageInfo ? `${storageInfo.usage} / ${storageInfo.quota}` : 'Storage information unavailable'}
                  </span>
                </div>
                {storageInfo && (
                  <div className="w-full bg-surface-low rounded-full h-2 overflow-hidden border border-outline-variant/20">
                    <div className="bg-secondary h-full rounded-full transition-all" style={{ width: `${storageInfo.percentage}%` }} />
                  </div>
                )}
              </div>

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-2 bg-surface-high hover:bg-surface-high/80 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <RefreshCw className="w-4 h-4 text-primary" />}
                <span>Force Manual Local Sync</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-surface-container border-t border-outline-variant/15 flex items-center justify-between text-xs">
          <span className="text-outline">Local Workspace Snapshot Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface-high hover:bg-surface-high/80 text-white rounded-lg transition-colors font-medium"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};

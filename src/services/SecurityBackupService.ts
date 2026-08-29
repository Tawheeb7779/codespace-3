import { Project, ProjectFile } from '../types';

export interface FileHashManifest {
  path: string;
  size: number;
  sha256: string;
}

export interface WorkspaceSnapshot {
  id: string;
  projectId: string;
  projectName: string;
  timestamp: string;
  fileCount: number;
  totalSize: number;
  manifest: FileHashManifest[];
  files: Record<string, ProjectFile>;
  projectMetadata: {
    description?: string;
    template?: string;
    branch?: string;
  };
  integrityStatus: 'valid' | 'corrupted' | 'unverified';
}

const SNAPSHOTS_KEY_PREFIX = 'codespace_3d_snapshot_';

export class SecurityBackupService {
  /**
   * Helper to compute browser SHA-256 hash using Web Crypto API
   */
  static async computeSHA256(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create a REAL snapshot from current project & files
   */
  static async createSnapshot(project: Project): Promise<WorkspaceSnapshot> {
    const files: Record<string, ProjectFile> = project.files || {};
    const manifest: FileHashManifest[] = [];
    let totalSize = 0;

    for (const file of Object.values(files)) {
      if (!file.isFolder) {
        const content = file.content || '';
        const size = new TextEncoder().encode(content).length;
        totalSize += size;
        const sha256 = await this.computeSHA256(content);
        manifest.push({ path: file.path, size, sha256 });
      }
    }

    const snapshotId = `snap_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const snapshot: WorkspaceSnapshot = {
      id: snapshotId,
      projectId: project.id,
      projectName: project.name,
      timestamp: new Date().toISOString(),
      fileCount: manifest.length,
      totalSize,
      manifest,
      files: JSON.parse(JSON.stringify(files)),
      projectMetadata: {
        description: project.description,
        template: project.template,
        branch: project.branch || 'main',
      },
      integrityStatus: 'valid',
    };

    // Save to localStorage / IndexedDB storage key
    const snapshots = this.getSnapshotsForProject(project.id);
    snapshots.unshift(snapshot);
    localStorage.setItem(
      `${SNAPSHOTS_KEY_PREFIX}${project.id}`,
      JSON.stringify(snapshots)
    );

    return snapshot;
  }

  /**
   * List all stored snapshots for a project
   */
  static getSnapshotsForProject(projectId: string): WorkspaceSnapshot[] {
    try {
      const raw = localStorage.getItem(`${SNAPSHOTS_KEY_PREFIX}${projectId}`);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn('Error reading snapshots from localStorage:', err);
      return [];
    }
  }

  /**
   * Verify SHA-256 hashes of a snapshot against its stored manifest
   */
  static async verifySnapshotIntegrity(snapshot: WorkspaceSnapshot): Promise<'valid' | 'corrupted'> {
    for (const item of snapshot.manifest) {
      const file = Object.values(snapshot.files).find((f) => f.path === item.path);
      if (!file || file.isFolder) {
        return 'corrupted';
      }
      const actualHash = await this.computeSHA256(file.content || '');
      if (actualHash !== item.sha256) {
        return 'corrupted';
      }
    }
    return 'valid';
  }

  /**
   * Delete a snapshot by ID
   */
  static deleteSnapshot(projectId: string, snapshotId: string): void {
    const snapshots = this.getSnapshotsForProject(projectId);
    const updated = snapshots.filter((s) => s.id !== snapshotId);
    localStorage.setItem(
      `${SNAPSHOTS_KEY_PREFIX}${projectId}`,
      JSON.stringify(updated)
    );
  }

  /**
   * Export snapshot as downloadable JSON archive
   */
  static exportSnapshotAsJSON(snapshot: WorkspaceSnapshot): void {
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snapshot.projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-snapshot-${snapshot.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import & validate a snapshot JSON string
   */
  static async importSnapshotFromJSON(
    jsonContent: string,
    currentProjectId: string
  ): Promise<WorkspaceSnapshot> {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (err) {
      throw new Error('Invalid JSON snapshot file.');
    }

    if (!parsed.id || !parsed.manifest || !parsed.files) {
      throw new Error('Invalid snapshot format: missing manifest or file tree.');
    }

    const importedSnapshot: WorkspaceSnapshot = { ...parsed, projectId: currentProjectId };
    const integrity = await this.verifySnapshotIntegrity(importedSnapshot);
    if (integrity === 'corrupted') {
      throw new Error('Snapshot integrity check failed: SHA-256 hash mismatch.');
    }

    importedSnapshot.integrityStatus = 'valid';

    // Save to list
    const snapshots = this.getSnapshotsForProject(currentProjectId);
    snapshots.unshift(importedSnapshot);
    localStorage.setItem(
      `${SNAPSHOTS_KEY_PREFIX}${currentProjectId}`,
      JSON.stringify(snapshots)
    );

    return importedSnapshot;
  }
}

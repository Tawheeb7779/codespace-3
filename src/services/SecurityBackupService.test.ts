import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityBackupService } from './SecurityBackupService';
import { Project } from '../types';

const mockProject: Project = {
  id: 'test-backup-project',
  name: 'Backup Test Project',
  description: 'Test project for snapshots',
  updatedAt: new Date().toISOString(),
  template: 'react-three',
  branch: 'main',
  files: {
    'App.tsx': {
      id: 'App.tsx',
      name: 'App.tsx',
      path: '/src/App.tsx',
      language: 'typescript',
      isFolder: false,
      parentId: 'src',
      content: 'console.log("hello world snapshot test");',
    },
  },
};

describe('SecurityBackupService & SHA-256 Workspace Snapshots', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('computes real SHA-256 hashes using Web Crypto API', async () => {
    const hash1 = await SecurityBackupService.computeSHA256('hello world');
    const hash2 = await SecurityBackupService.computeSHA256('hello world');
    const hash3 = await SecurityBackupService.computeSHA256('different content');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64); // SHA-256 hex string length
  });

  it('creates real workspace snapshot with metadata and file hashes', async () => {
    const snap = await SecurityBackupService.createSnapshot(mockProject);

    expect(snap.id).toBeDefined();
    expect(snap.projectName).toBe('Backup Test Project');
    expect(snap.fileCount).toBe(1);
    expect(snap.manifest.length).toBe(1);
    expect(snap.manifest[0].sha256).toBeDefined();
    expect(snap.integrityStatus).toBe('valid');

    const list = SecurityBackupService.getSnapshotsForProject('test-backup-project');
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(snap.id);
  });

  it('verifies snapshot integrity and detects corrupted contents', async () => {
    const snap = await SecurityBackupService.createSnapshot(mockProject);
    const initialCheck = await SecurityBackupService.verifySnapshotIntegrity(snap);
    expect(initialCheck).toBe('valid');

    // Corrupt file content
    snap.files['App.tsx'].content = 'CORRUPTED CONTENT HAS CHANGED';
    const corruptedCheck = await SecurityBackupService.verifySnapshotIntegrity(snap);
    expect(corruptedCheck).toBe('corrupted');
  });

  it('deletes snapshot from storage', async () => {
    const snap = await SecurityBackupService.createSnapshot(mockProject);
    expect(SecurityBackupService.getSnapshotsForProject('test-backup-project').length).toBe(1);

    SecurityBackupService.deleteSnapshot('test-backup-project', snap.id);
    expect(SecurityBackupService.getSnapshotsForProject('test-backup-project').length).toBe(0);
  });
});

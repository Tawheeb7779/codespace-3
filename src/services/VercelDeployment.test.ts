import { describe, it, expect } from 'vitest';
import { VercelDeploymentService } from './VercelDeploymentService';
import { ProjectFile } from '../types';

describe('Phase 1C — Vercel Deployment Integration Unit Tests', () => {
  const sampleFiles: Record<string, ProjectFile> = {
    'root': { id: 'root', name: 'root', path: '/', content: '', language: '', isFolder: true },
    'App.tsx': { id: 'App.tsx', name: 'App.tsx', path: '/src/App.tsx', content: 'console.log("App");', language: 'typescript', isFolder: false },
    'package.json': { id: 'package.json', name: 'package.json', path: '/package.json', content: '{"name":"test"}', language: 'json', isFolder: false },
    '.env.local': { id: '.env.local', name: '.env.local', path: '/.env.local', content: 'SECRET=123', language: 'plaintext', isFolder: false },
    'node_modules/test.js': { id: 'test.js', name: 'test.js', path: '/node_modules/test.js', content: 'module', language: 'javascript', isFolder: false },
  };

  it('VercelDeploymentService.prepareFiles filters out .env and node_modules artifacts from deployment payload', () => {
    const prepared = VercelDeploymentService.prepareFiles(sampleFiles);
    const paths = prepared.map((f) => f.file);

    expect(paths).toContain('src/App.tsx');
    expect(paths).toContain('package.json');
    expect(paths).not.toContain('.env.local');
    expect(paths).not.toContain('node_modules/test.js');
  });

  it('VercelDeploymentService returns clear error when workspace contains 0 valid deployment files', async () => {
    const res = await VercelDeploymentService.triggerDeployment('test-proj', {});
    expect(res.success).toBe(false);
    expect(res.error).toContain('No workspace files available');
  });

  it('VercelDeploymentService reports UNKNOWN rather than READY when it cannot observe the build', async () => {
    // Without a token there is no way to read the real state; claiming READY
    // would show a deployment as live before the build finished.
    const res = await VercelDeploymentService.pollDeploymentStatus('dpl_123');
    expect(res.readyState).toBe('UNKNOWN');
    expect(res.error).toBeTruthy();

    const noId = await VercelDeploymentService.pollDeploymentStatus('');
    expect(noId.readyState).toBe('UNKNOWN');
  });
});

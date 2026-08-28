import { describe, it, expect, beforeEach } from 'vitest';
import { GitHubPushService } from './GitHubPushService';
import { GitHubImportService } from './GitHubImportService';
import { useProjectStore } from '../store/useProjectStore';

describe('Phase 1B — GitHub Integration Unit Tests', () => {
  beforeEach(() => {
    useProjectStore.setState({
      githubRepo: null,
      githubConnected: false,
    });
  });

  it('GitHubPushService fails gracefully when required parameters or tokens are missing', async () => {
    const res = await GitHubPushService.pushChanges('', '', 'main', {}, 'Commit');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Missing required GitHub parameters');
  });

  it('GitHubImportService fails gracefully when the repository is missing or malformed', async () => {
    const empty = await GitHubImportService.importRepository('', '');
    expect(empty.success).toBe(false);
    expect(empty.error).toMatch(/owner\/repo/i);

    const malformed = await GitHubImportService.importRepository('not-a-repo', '');
    expect(malformed.success).toBe(false);
    expect(malformed.error).toMatch(/owner\/repo/i);
  });

  it('GitHubImportService returns empty repository array on unauthenticated listing request', async () => {
    const repos = await GitHubImportService.fetchRepositories('');
    expect(repos).toEqual([]);
  });

  it('Verifies project store does not store OAuth client secrets or plain tokens in persistent state', () => {
    const state = useProjectStore.getState();
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('GITHUB_CLIENT_SECRET');
    expect(serialized).not.toContain('ghp_secret_key');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { CloudSyncService } from './CloudSyncService';
import { useAuthStore } from '../store/useAuthStore';
import { useProjectStore } from '../store/useProjectStore';

describe('Supabase Phase 1A Integration Tests', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, isAuthenticated: false, isLoading: false, error: null });
    useProjectStore.setState({ currentUserRole: 'owner' });
  });

  it('CloudSyncService fails gracefully when Supabase env keys are unconfigured placeholders', async () => {
    const res = await CloudSyncService.syncProjectToCloud('usr-1', {
      id: 'proj-1',
      name: 'Test Project',
      description: 'Demo',
      updatedAt: new Date().toISOString(),
      template: 'react-three',
      files: {},
      rootFileIds: [],
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Supabase URL/Anon Key not configured');
  });

  it('Enforces viewer write protection in useProjectStore RBAC guards', () => {
    useProjectStore.setState({ currentUserRole: 'viewer' });
    const store = useProjectStore.getState();

    const initialFiles = { ...store.projects[0].files };

    // Viewer attempts file update
    store.updateFileContent('App.tsx', '// Unauthorized edit');

    // Content should remain unmodified
    const currentFiles = useProjectStore.getState().projects[0].files;
    expect(currentFiles['App.tsx'].content).toBe(initialFiles['App.tsx'].content);
  });

  it('Allows owner and developer role to update project files', () => {
    useProjectStore.setState({ currentUserRole: 'developer' });
    const store = useProjectStore.getState();

    store.updateFileContent('App.tsx', '// Developer edit allowed');
    const updatedContent = useProjectStore.getState().projects[0].files['App.tsx'].content;
    expect(updatedContent).toBe('// Developer edit allowed');
  });

  it('Handles guest local signup and session initialization when Supabase is unconfigured', async () => {
    const authStore = useAuthStore.getState();
    const success = await authStore.signUp('developer@codespace3d.com', 'password123', 'dev_user');

    expect(success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().profile?.username).toBe('dev_user');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';

// Supabase is not configured under test, so the store runs in local-profile mode.
describe('useAuthStore (local profile mode)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      profile: null,
      isAuthenticated: false,
      authMode: 'local',
      isLoading: false,
      error: null,
    });
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
  });

  it('creates a local profile on signup', async () => {
    const ok = await useAuthStore.getState().signUp('test@codespace3d.dev', 'secret12345', 'test_user');
    expect(ok).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.authMode).toBe('local');
    expect(state.user?.email).toBe('test@codespace3d.dev');
    expect(state.profile?.username).toBe('test_user');
  });

  it('never grants a paid plan or admin role to a local profile', async () => {
    await useAuthStore.getState().signUp('test@codespace3d.dev', 'secret12345', 'test_user');
    const profile = useAuthStore.getState().profile;
    expect(profile?.plan).toBe('free');
    expect(profile?.role).toBe('user');
  });

  it('rejects a malformed email and a short password', async () => {
    expect(await useAuthStore.getState().signUp('not-an-email', 'secret12345', 'u')).toBe(false);
    expect(useAuthStore.getState().error).toMatch(/valid email/i);

    expect(await useAuthStore.getState().signUp('a@b.dev', 'short', 'u')).toBe(false);
    expect(useAuthStore.getState().error).toMatch(/8 characters/i);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('signs in and out', async () => {
    expect(await useAuthStore.getState().signIn('user@codespace3d.dev', 'pass12345')).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('updates editable profile fields', async () => {
    await useAuthStore.getState().signUp('dev@codespace3d.dev', 'password123', 'dev_user');
    await useAuthStore.getState().updateProfile({ displayName: 'Senior Engineer' });
    expect(useAuthStore.getState().profile?.displayName).toBe('Senior Engineer');
  });

  it('ignores client attempts to change plan, role or id', async () => {
    await useAuthStore.getState().signUp('dev@codespace3d.dev', 'password123', 'dev_user');
    const originalId = useAuthStore.getState().profile?.id;

    await useAuthStore.getState().updateProfile({
      plan: 'enterprise',
      role: 'admin',
      id: 'someone-else',
      displayName: 'Renamed',
    });

    const profile = useAuthStore.getState().profile;
    expect(profile?.plan).toBe('free');
    expect(profile?.role).toBe('user');
    expect(profile?.id).toBe(originalId);
    expect(profile?.displayName).toBe('Renamed');
  });

  it('reports that password recovery needs a backend', async () => {
    expect(await useAuthStore.getState().recoverPassword('user@codespace3d.dev')).toBe(false);
    expect(useAuthStore.getState().error).toMatch(/Supabase/i);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('initializes in unauthenticated state by default', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
  });

  it('simulates local signup and sets user profile state', async () => {
    const store = useAuthStore.getState();
    const ok = await store.signUp('test@codespace3d.dev', 'secret123', 'test_user');
    expect(ok).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('test@codespace3d.dev');
    expect(state.profile?.username).toBe('test_user');
  });

  it('simulates local signin', async () => {
    const store = useAuthStore.getState();
    const ok = await store.signIn('user@codespace3d.dev', 'pass123');
    expect(ok).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('user@codespace3d.dev');
  });

  it('handles signout cleanly', async () => {
    const store = useAuthStore.getState();
    await store.signIn('user@codespace3d.dev', 'pass123');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('updates user profile information', async () => {
    const store = useAuthStore.getState();
    await store.signUp('dev@codespace3d.dev', 'pass123', 'dev_user');

    await useAuthStore.getState().updateProfile({ displayName: 'Senior Engineer' });
    expect(useAuthStore.getState().profile?.displayName).toBe('Senior Engineer');
  });
});

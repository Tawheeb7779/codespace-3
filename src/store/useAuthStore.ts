import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  plan: 'free' | 'pro' | 'enterprise';
  role: 'user' | 'admin';
  createdAt: string;
}

/**
 * `supabase` means a verified server session. `local` means a device-only
 * profile used to label work when no backend is configured - it authenticates
 * nothing and grants no entitlements.
 */
export type AuthMode = 'supabase' | 'local';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  authMode: AuthMode;
  isLoading: boolean;
  error: string | null;

  initializeAuth: () => Promise<void>;
  signUp: (email: string, pass: string, username: string) => Promise<boolean>;
  signIn: (email: string, pass: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  recoverPassword: (email: string) => Promise<boolean>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';

function localProfile(id: string, username: string): UserProfile {
  return {
    id,
    username,
    displayName: username,
    avatarUrl: DEFAULT_AVATAR,
    // A device-local profile never carries a paid plan or elevated role.
    plan: 'free',
    role: 'user',
    createdAt: new Date().toISOString(),
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      authMode: isSupabaseConfigured ? 'supabase' : 'local',
      isLoading: false,
      error: null,

      initializeAuth: async () => {
        if (!isSupabaseConfigured) {
          set({ authMode: 'local' });
          return;
        }

        set({ isLoading: true, authMode: 'supabase' });
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.user) {
            // A stale persisted profile must not survive an expired session.
            set({ user: null, profile: null, isAuthenticated: false, isLoading: false });
            return;
          }

          const user = { id: session.user.id, email: session.user.email || '' };
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          const fallbackName = user.email.split('@')[0] || 'user';
          const profile: UserProfile = profileData
            ? {
                id: profileData.id,
                username: profileData.username,
                displayName: profileData.display_name || profileData.username,
                avatarUrl: profileData.avatar_url || DEFAULT_AVATAR,
                plan: profileData.plan || 'free',
                role: profileData.role || 'user',
                createdAt: profileData.created_at,
              }
            : { ...localProfile(user.id, fallbackName), createdAt: new Date().toISOString() };

          set({ user, profile, isAuthenticated: true, isLoading: false, error: null });
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : String(e), isLoading: false });
        }
      },

      signUp: async (email, password, username) => {
        set({ isLoading: true, error: null });

        if (!isValidEmail(email)) {
          set({ error: 'Enter a valid email address.', isLoading: false });
          return false;
        }
        if (password.length < 8) {
          set({ error: 'Password must be at least 8 characters.', isLoading: false });
          return false;
        }
        if (!username.trim()) {
          set({ error: 'Choose a username.', isLoading: false });
          return false;
        }

        if (!isSupabaseConfigured) {
          const id = `local-${Date.now().toString(36)}`;
          set({
            user: { id, email },
            profile: localProfile(id, username.trim()),
            isAuthenticated: true,
            authMode: 'local',
            isLoading: false,
          });
          return true;
        }

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username, display_name: username } },
          });
          if (error) throw error;

          if (!data.user) {
            set({ isLoading: false });
            return false;
          }

          // With email confirmation enabled there is no session yet; do not
          // report the user as signed in.
          if (!data.session) {
            set({
              isLoading: false,
              error: 'Check your email to confirm the account, then sign in.',
            });
            return true;
          }

          await get().initializeAuth();
          return true;
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : String(e), isLoading: false });
          return false;
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true, error: null });

        if (!isValidEmail(email)) {
          set({ error: 'Enter a valid email address.', isLoading: false });
          return false;
        }

        if (!isSupabaseConfigured) {
          const username = email.split('@')[0] || 'user';
          const id = `local-${username}`;
          set({
            user: { id, email },
            profile: localProfile(id, username),
            isAuthenticated: true,
            authMode: 'local',
            isLoading: false,
          });
          return true;
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (!data.user) {
            set({ isLoading: false });
            return false;
          }
          await get().initializeAuth();
          return true;
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : String(e), isLoading: false });
          return false;
        }
      },

      signOut: async () => {
        if (isSupabaseConfigured) {
          await supabase.auth.signOut().catch(() => undefined);
        }
        set({ user: null, profile: null, isAuthenticated: false, error: null });
      },

      recoverPassword: async (email) => {
        set({ isLoading: true, error: null });

        if (!isSupabaseConfigured) {
          set({
            isLoading: false,
            error: 'Password recovery needs a configured Supabase backend. This build stores profiles locally.',
          });
          return false;
        }

        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          if (error) throw error;
          set({ isLoading: false });
          return true;
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : String(e), isLoading: false });
          return false;
        }
      },

      updateProfile: async (data) => {
        const { profile } = get();
        if (!profile) return;

        // plan and role are server-controlled; the client cannot grant them.
        const { plan: _plan, role: _role, id: _id, ...safe } = data;
        const updated = { ...profile, ...safe };
        set({ profile: updated });

        if (isSupabaseConfigured) {
          const { error } = await supabase
            .from('profiles')
            .update({
              username: updated.username,
              display_name: updated.displayName,
              avatar_url: updated.avatarUrl,
            })
            .eq('id', profile.id);
          if (error) set({ error: error.message });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'codespace-3d-auth',
      version: 2,
      /**
       * Only a device-local profile is persisted. A Supabase session is owned by
       * the Supabase client and re-validated on load, so persisting
       * `isAuthenticated` here would show a signed-in UI for an expired session.
       */
      partialize: (state) =>
        state.authMode === 'local'
          ? {
              user: state.user,
              profile: state.profile,
              isAuthenticated: state.isAuthenticated,
              authMode: state.authMode,
            }
          : { authMode: state.authMode },
    }
  )
);

/** Restores an existing session and keeps the store in step with Supabase. */
export function initializeAuthListener(): () => void {
  void useAuthStore.getState().initializeAuth();

  if (!isSupabaseConfigured) return () => undefined;

  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ user: null, profile: null, isAuthenticated: false });
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      void useAuthStore.getState().initializeAuth();
    }
  });

  return () => data.subscription.unsubscribe();
}

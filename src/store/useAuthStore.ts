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

interface AuthState {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  signUp: (email: string, pass: string, username: string) => Promise<boolean>;
  signIn: (email: string, pass: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  recoverPassword: (email: string) => Promise<boolean>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      initializeAuth: async () => {
        if (!isSupabaseConfigured) {
          return;
        }

        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const user = { id: session.user.id, email: session.user.email || '' };

            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            const profile: UserProfile = profileData ? {
              id: profileData.id,
              username: profileData.username,
              displayName: profileData.display_name,
              avatarUrl: profileData.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
              plan: profileData.plan || 'free',
              role: profileData.role || 'user',
              createdAt: profileData.created_at,
            } : {
              id: user.id,
              username: user.email.split('@')[0],
              displayName: user.email.split('@')[0],
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
              plan: 'pro',
              role: 'user',
              createdAt: new Date().toISOString(),
            };

            set({ user, profile, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, profile: null, isAuthenticated: false, isLoading: false });
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          set({ error: msg, isLoading: false });
        }
      },

      signUp: async (email, password, username) => {
        set({ isLoading: true, error: null });
        if (!isSupabaseConfigured) {
          const localId = 'usr-' + Date.now().toString().slice(-6);
          const user = { id: localId, email };
          const profile: UserProfile = {
            id: localId,
            username,
            displayName: username,
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
            plan: 'pro',
            role: 'user',
            createdAt: new Date().toISOString(),
          };
          set({ user, profile, isAuthenticated: true, isLoading: false });
          return true;
        }

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { username, display_name: username },
            },
          });

          if (error) throw error;

          if (data.user) {
            const user = { id: data.user.id, email: data.user.email || '' };
            const profile: UserProfile = {
              id: data.user.id,
              username,
              displayName: username,
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
              plan: 'free',
              role: 'user',
              createdAt: new Date().toISOString(),
            };

            set({ user, profile, isAuthenticated: true, isLoading: false });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          set({ error: msg, isLoading: false });
          return false;
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        if (!isSupabaseConfigured) {
          const localId = 'usr-local';
          const user = { id: localId, email };
          const profile: UserProfile = {
            id: localId,
            username: email.split('@')[0],
            displayName: email.split('@')[0],
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
            plan: 'pro',
            role: 'user',
            createdAt: new Date().toISOString(),
          };
          set({ user, profile, isAuthenticated: true, isLoading: false });
          return true;
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;

          if (data.user) {
            await get().initializeAuth();
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          set({ error: msg, isLoading: false });
          return false;
        }
      },

      signOut: async () => {
        if (isSupabaseConfigured) {
          await supabase.auth.signOut().catch(() => {});
        }
        set({ user: null, profile: null, isAuthenticated: false, error: null });
      },

      recoverPassword: async (email) => {
        set({ isLoading: true, error: null });
        if (!isSupabaseConfigured) {
          set({ isLoading: false });
          return true;
        }
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          if (error) throw error;
          set({ isLoading: false });
          return true;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          set({ error: msg, isLoading: false });
          return false;
        }
      },

      updateProfile: async (data) => {
        const { profile } = get();
        if (!profile) return;
        const updated = { ...profile, ...data };
        set({ profile: updated });

        if (isSupabaseConfigured) {
          try {
            await supabase
              .from('profiles')
              .update({
                username: updated.username,
                display_name: updated.displayName,
                avatar_url: updated.avatarUrl,
                plan: updated.plan,
              })
              .eq('id', profile.id);
          } catch {
            // Ignore offline update errors
          }
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'codespace-3d-auth',
    }
  )
);

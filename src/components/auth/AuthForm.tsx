import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { isSupabaseConfigured } from '../../services/supabaseClient';

export type AuthFormMode = 'signin' | 'signup' | 'recover';

interface AuthFormProps {
  initialMode?: AuthFormMode;
  /** Fires once the user is actually authenticated (not on a "check your email" state). */
  onSuccess: () => void;
}

/**
 * Email/password auth form, shared by the AuthModal (quick access from the nav)
 * and the full-page SignInPage (the OAuth redirect target for protected routes).
 */
export const AuthForm: React.FC<AuthFormProps> = ({ initialMode = 'signin', onSuccess }) => {
  const { signIn, signUp, recoverPassword, isLoading, error, clearError } = useAuthStore();

  const [mode, setMode] = useState<AuthFormMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg(null);

    if (mode === 'signin') {
      const ok = await signIn(email, password);
      if (ok) onSuccess();
    } else if (mode === 'signup') {
      const ok = await signUp(email, password, username || email.split('@')[0]);
      if (ok && useAuthStore.getState().isAuthenticated) {
        setSuccessMsg(
          isSupabaseConfigured ? 'Account created and signed in.' : 'Local profile created on this device.'
        );
        setTimeout(() => onSuccess(), 1200);
      }
    } else if (mode === 'recover') {
      const ok = await recoverPassword(email);
      if (ok) {
        setSuccessMsg('Password recovery instructions sent to your email.');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white font-semibold text-sm">
        {mode === 'signin' && <LogIn className="w-4 h-4 text-primary" />}
        {mode === 'signup' && <UserPlus className="w-4 h-4 text-emerald-400" />}
        {mode === 'recover' && <KeyRound className="w-4 h-4 text-amber-400" />}
        <span className="capitalize">{mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Recover Password'}</span>
      </div>

      {!isSupabaseConfigured && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed">
          No authentication backend is configured, so this creates a profile stored on this device only. It does
          not verify your identity, sync anything, or protect your projects. Set VITE_SUPABASE_URL and
          VITE_SUPABASE_ANON_KEY to enable real accounts.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        {mode === 'signup' && (
          <div>
            <label className="block text-[11px] text-outline mb-1">Username</label>
            <input
              type="text"
              required
              placeholder="e.g. alex_developer"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] text-outline mb-1">Email Address</label>
          <input
            type="email"
            required
            placeholder="user@codespace3d.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white focus:outline-none focus:border-primary"
          />
        </div>

        {mode !== 'recover' && (
          <div>
            <label className="block text-[11px] text-outline mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white focus:outline-none focus:border-primary font-mono"
            />
          </div>
        )}

        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-[11px] flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-300 text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-primary-container text-white font-medium rounded hover:bg-primary-container/80 transition-colors disabled:opacity-50"
        >
          {isLoading
            ? 'Processing...'
            : mode === 'signin'
            ? 'Sign In to Workspace'
            : mode === 'signup'
            ? 'Create CodeSpace Account'
            : 'Send Password Reset Email'}
        </button>
      </form>

      <div className="pt-2 border-t border-outline-variant/10 flex justify-between items-center text-[10px] text-outline">
        {mode === 'signin' ? (
          <>
            <button onClick={() => setMode('signup')} className="hover:text-primary">
              Need an account? Sign Up
            </button>
            <button onClick={() => setMode('recover')} className="hover:text-amber-400">
              Forgot password?
            </button>
          </>
        ) : (
          <button onClick={() => setMode('signin')} className="hover:text-primary">
            Already have an account? Sign In
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'recover';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const { signIn, signUp, recoverPassword, isLoading, error, clearError } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'signup' | 'recover'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg(null);

    if (mode === 'signin') {
      const ok = await signIn(email, password);
      if (ok) onClose();
    } else if (mode === 'signup') {
      const ok = await signUp(email, password, username || email.split('@')[0]);
      if (ok) {
        setSuccessMsg('Account created successfully! Session initialized.');
        setTimeout(() => onClose(), 1200);
      }
    } else if (mode === 'recover') {
      const ok = await recoverPassword(email);
      if (ok) {
        setSuccessMsg('Password recovery instructions sent to your email.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="glass-panel w-full max-w-sm rounded-xl p-5 space-y-4 border border-outline-variant/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            {mode === 'signin' && <LogIn className="w-4 h-4 text-primary" />}
            {mode === 'signup' && <UserPlus className="w-4 h-4 text-emerald-400" />}
            {mode === 'recover' && <KeyRound className="w-4 h-4 text-amber-400" />}
            <span className="capitalize">{mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Recover Password'}</span>
          </div>
          <button onClick={onClose} className="p-1 text-outline hover:text-white rounded hover:bg-surface-high">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
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

        {/* Footer Mode Switcher */}
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
    </div>
  );
};

import React, { useState } from 'react';
import {
  User,
  X,
  Sparkles,
  LogOut,
  Check,
  Calendar,
  Mail
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, signOut, updateProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName: displayName.trim(),
      username: username.trim(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="glass-panel w-full max-w-md rounded-xl p-5 space-y-4 border border-outline-variant/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <User className="w-4 h-4 text-primary" />
            <span>Account & User Profile</span>
          </div>
          <button onClick={onClose} className="p-1 text-outline hover:text-white rounded hover:bg-surface-high">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 p-3 bg-surface-container rounded-lg border border-outline-variant/15">
          <img
            src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt="User Avatar"
            className="w-12 h-12 rounded-full border border-primary/40 object-cover"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-100 text-sm truncate">{profile?.displayName || 'Developer'}</h4>
            <p className="text-[11px] text-outline font-mono truncate">@{profile?.username || 'user'}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary-container/30 text-primary border border-primary/30 font-mono uppercase font-semibold">
                {profile?.plan || 'PRO'} PLAN
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono uppercase font-semibold">
                {profile?.role || 'USER'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] text-outline mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] text-outline mb-1">Username Handle</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div className="space-y-1.5 text-[11px] font-mono text-outline p-2.5 bg-surface-high/50 rounded border border-outline-variant/10">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span>Email: {user?.email || 'guest@codespace3d.dev'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-tertiary" />
              <span>Created: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Active Session'}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded font-medium transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>

            <button
              type="submit"
              className="px-4 py-1.5 bg-primary-container text-white rounded font-medium hover:bg-primary-container/80 transition-colors flex items-center gap-1.5"
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-secondary" />}
              {isSaved ? 'Saved Profile' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

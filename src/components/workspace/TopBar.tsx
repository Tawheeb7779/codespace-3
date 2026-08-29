import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Boxes,
  GitBranch,
  Play,
  Square,
  RotateCw,
  Sparkles,
  Settings,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  EyeOff,
  Command,
  User,
  Bell,
  CloudUpload,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Save,
  PanelRight
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useRuntimeStore, isRuntimeBusy } from '../../runtime/RuntimeManager';
import { useLayoutStore } from '../../store/useLayoutStore';
import { usePreferenceStore } from '../../store/usePreferenceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { UserProfileModal } from '../account/UserProfileModal';
import { AuthModal } from '../auth/AuthModal';

interface TopBarProps {
  activeView: 'code' | '3d' | 'preview' | 'split';
  setActiveView: (view: 'code' | '3d' | 'preview' | 'split') => void;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  isRunActive: boolean;
  onToggleRun: () => void;
  onRefreshPreview: () => void;
  toggleAiAssistant: () => void;
  isAiOpen: boolean;
  toggleNotifications: () => void;
  isNotificationsOpen: boolean;
  onOpenVercelModal: () => void;
  onOpenHelpModal: () => void;
  onOpenAdminModal: () => void;
  onOpenSecurityBackupModal: () => void;
  onOpenCommandPalette: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  setActiveView,
  previewDevice,
  setPreviewDevice,
  isRunActive,
  onToggleRun,
  onRefreshPreview,
  toggleAiAssistant,
  isAiOpen,
  toggleNotifications,
  isNotificationsOpen,
  onOpenVercelModal,
  onOpenHelpModal,
  onOpenAdminModal,
  onOpenSecurityBackupModal,
  onOpenCommandPalette,
}) => {
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const gitBranch = useProjectStore((s) => s.gitBranch);
  const gitStatus = useProjectStore((s) => s.gitStatus);
  const saveAllFiles = useProjectStore((s) => s.saveAllFiles);
  const runtimePhase = useRuntimeStore((s) => s.phase);
  const runtimeBusy = isRuntimeBusy(runtimePhase);
  const rightPanel = useLayoutStore((s) => s.rightPanel);
  const setRightPanel = useLayoutStore((s) => s.setRightPanel);
  const isPreviewDocked = rightPanel === 'preview';
  const { enable3DWorkspace, setEnable3DWorkspace } = usePreferenceStore();
  const { isAuthenticated, profile } = useAuthStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const currentProject = projects.find((p) => p.id === activeProjectId);

  return (
    <>
      <header className="h-12 bg-[#050507]/90 backdrop-blur-md border-b border-white/10 px-3 flex items-center justify-between z-40 select-none text-xs font-sans">
        {/* Left: Branding & Project Meta */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Back to Command Center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 pr-3 border-r border-white/10">
            <div className="w-6 h-6 rounded-lg bg-[#ef233c] flex items-center justify-center text-white shadow-red-glow-sm">
              <Boxes className="w-3.5 h-3.5" />
            </div>
            <span className="font-display font-extrabold text-white tracking-wider hidden sm:inline">CODESPACE <span className="text-[#ef233c]">3D</span></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-200">{currentProject?.name || 'Workspace'}</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#121215] border border-white/10 text-[10px] text-zinc-400 font-mono">
              <GitBranch className="w-3 h-3 text-[#ef233c]" />
              <span>{gitBranch}</span>
              {gitStatus.unstaged.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef233c] shadow-red-glow-sm" title="Unstaged changes" />
              )}
            </div>
          </div>
        </div>

        {/* Middle: View Mode, Preview & Deploy Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#121215] p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveView('code')}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                activeView === 'code' ? 'bg-[#ef233c] text-white shadow-red-glow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveView('split')}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                activeView === 'split' ? 'bg-[#ef233c] text-white shadow-red-glow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Split 3D
            </button>
            <button
              onClick={() => setActiveView('3d')}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                activeView === '3d' ? 'bg-[#ef233c] text-white shadow-red-glow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Spatial 3D
            </button>
            <button
              onClick={() => setActiveView('preview')}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                activeView === 'preview' ? 'bg-[#ef233c] text-white shadow-red-glow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Preview
            </button>
          </div>

          {(activeView === 'preview' || activeView === 'split') && (
            <div className="hidden md:flex items-center gap-1 pl-2 border-l border-white/10">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg ${previewDevice === 'desktop' ? 'bg-[#ef233c]/20 text-[#ef233c]' : 'text-zinc-400 hover:text-white'}`}
                title="Desktop Viewport"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded-lg ${previewDevice === 'tablet' ? 'bg-[#ef233c]/20 text-[#ef233c]' : 'text-zinc-400 hover:text-white'}`}
                title="Tablet Viewport"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg ${previewDevice === 'mobile' ? 'bg-[#ef233c]/20 text-[#ef233c]' : 'text-zinc-400 hover:text-white'}`}
                title="Mobile Viewport"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
            <button
              onClick={onToggleRun}
              title={`Runtime: ${runtimePhase}`}
              className={`px-3 py-1 rounded-xl font-semibold text-[11px] flex items-center gap-1.5 transition-all ${
                isRunActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-[#ef233c] text-white shadow-red-glow-sm hover:bg-[#d90429]'
              }`}
            >
              {runtimeBusy ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isRunActive ? (
                <Square className="w-3 h-3 fill-current" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              <span>{runtimeBusy ? runtimePhase : isRunActive ? 'Stop' : 'Run Preview'}</span>
            </button>

            <button
              onClick={saveAllFiles}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Save all files (Ctrl/Cmd+S)"
            >
              <Save className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setRightPanel(isPreviewDocked ? null : 'preview')}
              className={`p-1.5 rounded-lg transition-colors ${
                isPreviewDocked
                  ? 'bg-[#ef233c]/15 text-[#ef233c]'
                  : 'hover:bg-white/10 text-zinc-400 hover:text-white'
              }`}
              title={isPreviewDocked ? 'Close preview panel' : 'Open preview beside the editor'}
            >
              <PanelRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onRefreshPreview}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Reload preview"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Vercel Deploy Trigger Button */}
            <button
              onClick={onOpenVercelModal}
              className="px-2.5 py-1 bg-[#121215] hover:bg-white/10 text-zinc-200 rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors font-semibold text-[11px]"
              title="Deploy to Vercel Cloud"
            >
              <CloudUpload className="w-3.5 h-3.5 text-[#ef233c]" />
              <span className="hidden xl:inline">Deploy Vercel</span>
            </button>

            <button
              onClick={onOpenCommandPalette}
              className="px-2 py-1 bg-[#121215] hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl border border-white/10 flex items-center gap-1 transition-colors font-mono text-[10px]"
              title="Command Palette (⌘K)"
            >
              <Command className="w-3 h-3 text-[#ef233c]">⌘K</Command>
            </button>
          </div>
        </div>

        {/* Right: Security Backup, Admin, Help, Notifications, User Profile & AI & Toggles */}
        <div className="flex items-center gap-2">
          {/* Security Backup & Snapshot Vault Trigger */}
          <button
            onClick={onOpenSecurityBackupModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-white/10 transition-colors"
            title="Security Backup & Snapshot Vault"
          >
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Admin Control Center Trigger Button */}
          <button
            onClick={onOpenAdminModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Admin Control Center"
          >
            <ShieldCheck className="w-4 h-4 text-[#ef233c]" />
          </button>

          {/* Help & Support Portal Trigger */}
          <button
            onClick={onOpenHelpModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Help & Support Portal"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Notification Bell Icon Trigger */}
          <button
            onClick={toggleNotifications}
            className={`p-1.5 rounded-lg relative transition-colors ${
              isNotificationsOpen ? 'bg-[#ef233c]/20 text-[#ef233c]' : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef233c] rounded-full animate-pulse shadow-red-glow-sm" />
          </button>

          {isAuthenticated && profile ? (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="User Account Profile"
            >
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-6 h-6 rounded-full border border-[#ef233c]/50 object-cover"
              />
              <span className="font-mono text-[11px] text-zinc-200 hidden lg:inline">@{profile.username}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-2.5 py-1 bg-[#ef233c] text-white rounded-xl font-semibold text-[11px] flex items-center gap-1 hover:bg-[#d90429] transition-colors shadow-red-glow-sm"
            >
              <User className="w-3.5 h-3.5" /> Sign In
            </button>
          )}

          <button
            onClick={() => setEnable3DWorkspace(!enable3DWorkspace)}
            className={`p-1.5 rounded-lg transition-colors ${
              enable3DWorkspace ? 'text-[#ef233c] bg-[#ef233c]/10' : 'text-zinc-400 hover:text-white'
            }`}
            title={enable3DWorkspace ? 'Disable 3D Workspace' : 'Enable 3D Workspace'}
          >
            {enable3DWorkspace ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleAiAssistant}
            className={`px-3 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
              isAiOpen
                ? 'bg-[#ef233c] text-white shadow-red-glow-sm'
                : 'bg-[#121215] text-[#ef233c] border border-[#ef233c]/30 hover:bg-[#ef233c]/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Coding Assistant</span>
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* User Modals */}
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

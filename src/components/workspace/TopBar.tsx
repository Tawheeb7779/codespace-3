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
  Cloud,
  Loader2,
  Save,
  Bell
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { usePreferenceStore } from '../../store/usePreferenceStore';
import { useRuntimeStore } from '../../runtime/RuntimeManager';
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
  onOpenCommandPalette: () => void;
  onOpenDeploy: () => void;
  onOpenNotifications: () => void;
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
  onOpenCommandPalette,
  onOpenDeploy,
  onOpenNotifications,
}) => {
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const gitBranch = useProjectStore((s) => s.gitBranch);
  const gitStatus = useProjectStore((s) => s.gitStatus);
  const saveAllFiles = useProjectStore((s) => s.saveAllFiles);
  const { enable3DWorkspace, setEnable3DWorkspace } = usePreferenceStore();
  const { isAuthenticated, profile } = useAuthStore();
  const runtimePhase = useRuntimeStore((s) => s.phase);
  const runtimeErrorCount = useRuntimeStore((s) => s.errors.length);

  const isRuntimeBusy =
    runtimePhase === 'booting' ||
    runtimePhase === 'mounting' ||
    runtimePhase === 'installing' ||
    runtimePhase === 'starting' ||
    runtimePhase === 'stopping';

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const currentProject = projects.find((p) => p.id === activeProjectId);

  return (
    <>
      <header className="h-12 bg-surface-low/90 backdrop-blur-md border-b border-outline-variant/15 px-3 flex items-center justify-between z-40 select-none text-xs">
        {/* Left: Branding & Project Meta */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 hover:bg-surface-high rounded text-outline hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 pr-3 border-r border-outline-variant/15">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-primary-dark via-primary-container to-secondary flex items-center justify-center text-slate-950 font-bold">
              <Boxes className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-white tracking-tight hidden sm:inline">CodeSpace 3D</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-200">{currentProject?.name || 'Workspace'}</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-high border border-outline-variant/20 text-[11px] text-outline font-mono">
              <GitBranch className="w-3 h-3 text-primary" />
              <span>{gitBranch}</span>
              {gitStatus.unstaged.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unstaged changes" />
              )}
            </div>
          </div>
        </div>

        {/* Middle: View Mode & Preview Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-container p-0.5 rounded-lg border border-outline-variant/15">
            <button
              onClick={() => setActiveView('code')}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${
                activeView === 'code' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveView('split')}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${
                activeView === 'split' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
              }`}
            >
              Split 3D
            </button>
            <button
              onClick={() => setActiveView('3d')}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${
                activeView === '3d' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
              }`}
            >
              Spatial 3D
            </button>
            <button
              onClick={() => setActiveView('preview')}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${
                activeView === 'preview' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
              }`}
            >
              Preview
            </button>
          </div>

          {(activeView === 'preview' || activeView === 'split') && (
            <div className="hidden md:flex items-center gap-1 pl-2 border-l border-outline-variant/15">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-primary/20 text-primary' : 'text-outline hover:text-white'}`}
                title="Desktop Viewport"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1 rounded ${previewDevice === 'tablet' ? 'bg-primary/20 text-primary' : 'text-outline hover:text-white'}`}
                title="Tablet Viewport"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-primary/20 text-primary' : 'text-outline hover:text-white'}`}
                title="Mobile Viewport"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 pl-2 border-l border-outline-variant/15">
            <button
              onClick={onToggleRun}
              disabled={isRuntimeBusy && runtimePhase === 'stopping'}
              title={`Runtime: ${runtimePhase}`}
              className={`px-2.5 py-1 rounded font-medium text-[11px] flex items-center gap-1.5 transition-all disabled:opacity-50 ${
                isRunActive || isRuntimeBusy
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
            >
              {isRuntimeBusy ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isRunActive ? (
                <Square className="w-3 h-3 fill-current" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              <span>{isRuntimeBusy ? runtimePhase : isRunActive ? 'Stop' : 'Run'}</span>
            </button>

            <button
              onClick={saveAllFiles}
              className="p-1.5 rounded hover:bg-surface-high text-outline hover:text-white transition-colors"
              title="Save all files (Ctrl/Cmd+S)"
            >
              <Save className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onRefreshPreview}
              className="p-1.5 rounded hover:bg-surface-high text-outline hover:text-white transition-colors"
              title="Refresh Sandboxed Preview"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenCommandPalette}
              className="px-2 py-1 bg-surface-high hover:bg-surface-high/80 text-outline hover:text-white rounded border border-outline-variant/20 flex items-center gap-1 transition-colors"
              title="Command Palette (⌘K)"
            >
              <Command className="w-3 h-3 text-primary" />
              <span className="font-mono text-[10px]">⌘K</span>
            </button>
          </div>
        </div>

        {/* Right: User Profile & AI & Toggles */}
        <div className="flex items-center gap-2">
          {isAuthenticated && profile ? (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-1.5 p-1 rounded hover:bg-surface-high transition-colors"
              title="User Account Profile"
            >
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-6 h-6 rounded-full border border-primary/40 object-cover"
              />
              <span className="font-mono text-[11px] text-slate-200 hidden lg:inline">@{profile.username}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-2.5 py-1 bg-primary-container text-white rounded font-medium text-[11px] flex items-center gap-1 hover:bg-primary-container/80 transition-colors"
            >
              <User className="w-3.5 h-3.5" /> Sign In
            </button>
          )}

          <button
            onClick={() => setEnable3DWorkspace(!enable3DWorkspace)}
            className={`p-1.5 rounded transition-colors ${
              enable3DWorkspace ? 'text-primary bg-primary/10' : 'text-outline hover:text-white'
            }`}
            title={enable3DWorkspace ? 'Disable 3D Workspace' : 'Enable 3D Workspace'}
          >
            {enable3DWorkspace ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleAiAssistant}
            className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              isAiOpen
                ? 'bg-secondary text-slate-950 font-semibold'
                : 'bg-surface-high text-secondary border border-secondary/30 hover:bg-secondary/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Coding Assistant</span>
          </button>

          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 text-outline hover:text-white rounded hover:bg-surface-high transition-colors"
            title="Runtime notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {runtimeErrorCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-red-500 text-white text-[9px] font-mono leading-[14px] text-center">
                {runtimeErrorCount > 9 ? '9+' : runtimeErrorCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenDeploy}
            className="p-1.5 text-outline hover:text-white rounded hover:bg-surface-high transition-colors"
            title="Deploy to Vercel"
          >
            <Cloud className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 text-outline hover:text-white rounded hover:bg-surface-high transition-colors"
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

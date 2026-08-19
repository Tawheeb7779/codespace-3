import React from 'react';
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
  EyeOff
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { usePreferenceStore } from '../../store/usePreferenceStore';

interface TopBarProps {
  activeView: 'code' | '3d' | 'preview' | 'split';
  setActiveView: (view: 'code' | '3d' | 'preview' | 'split') => void;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  isRunActive: boolean;
  setIsRunActive: (run: boolean) => void;
  onRefreshPreview: () => void;
  toggleAiAssistant: () => void;
  isAiOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  setActiveView,
  previewDevice,
  setPreviewDevice,
  isRunActive,
  setIsRunActive,
  onRefreshPreview,
  toggleAiAssistant,
  isAiOpen,
}) => {
  const navigate = useNavigate();
  const { projects, activeProjectId, gitBranch, gitStatus } = useProjectStore();
  const { enable3DWorkspace, setEnable3DWorkspace } = usePreferenceStore();

  const currentProject = projects.find((p) => p.id === activeProjectId);

  return (
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
            onClick={() => setIsRunActive(!isRunActive)}
            className={`px-2.5 py-1 rounded font-medium text-[11px] flex items-center gap-1.5 transition-all ${
              isRunActive
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            {isRunActive ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isRunActive ? 'Stop' : 'Run Preview'}</span>
          </button>

          <button
            onClick={onRefreshPreview}
            className="p-1.5 rounded hover:bg-surface-high text-outline hover:text-white transition-colors"
            title="Refresh Sandboxed Preview"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: AI & Toggles */}
      <div className="flex items-center gap-2">
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
          onClick={() => navigate('/dashboard')}
          className="p-1.5 text-outline hover:text-white rounded hover:bg-surface-high transition-colors"
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

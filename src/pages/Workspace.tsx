import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';

import { TopBar } from '../components/workspace/TopBar';
import { Sidebar, SidebarTab } from '../components/workspace/Sidebar';
import { FileExplorerPanel } from '../components/workspace/FileExplorerPanel';
import { GitSourceControlPanel } from '../components/workspace/GitSourceControlPanel';
import { Spatial3DWorkspace } from '../components/workspace/Spatial3DWorkspace';
import { CodeEditor } from '../components/workspace/CodeEditor';
import { LivePreview } from '../components/workspace/LivePreview';
import { Terminal } from '../components/workspace/Terminal';
import { BottomPanel } from '../components/workspace/BottomPanel';
import { AiAssistantDrawer } from '../components/workspace/AiAssistantDrawer';
import { NotificationsDrawer } from '../components/workspace/NotificationsDrawer';
import { VercelDeploymentModal } from '../components/workspace/VercelDeploymentModal';
import { PackageManagerPanel } from '../components/workspace/PackageManagerPanel';
import { AssetsManagerPanel } from '../components/workspace/AssetsManagerPanel';
import { TaskManagerPanel } from '../components/workspace/TaskManagerPanel';
import { TeamChatPanel } from '../components/workspace/TeamChatPanel';
import { AnalyticsPanel } from '../components/workspace/AnalyticsPanel';
import { SqlStudioPanel } from '../components/workspace/SqlStudioPanel';
import { CommandPaletteModal } from '../components/workspace/CommandPaletteModal';

export default function Workspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, activeProjectId, setActiveProject } = useProjectStore();

  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('explorer');
  const [activeView, setActiveView] = useState<'code' | '3d' | 'preview' | 'split'>('split');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isRunActive, setIsRunActive] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isVercelModalOpen, setIsVercelModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    if (projectId) {
      const exists = projects.some((p) => p.id === projectId);
      if (exists) {
        setActiveProject(projectId);
      } else {
        navigate('/dashboard');
      }
    }
  }, [projectId, projects, setActiveProject, navigate]);

  const currentProject = projects.find((p) => p.id === activeProjectId);
  if (!currentProject) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-[#dee2f1] overflow-hidden select-none font-sans">
      {/* Top Header Bar */}
      <TopBar
        activeView={activeView}
        setActiveView={setActiveView}
        previewDevice={previewDevice}
        setPreviewDevice={setPreviewDevice}
        isRunActive={isRunActive}
        setIsRunActive={setIsRunActive}
        onRefreshPreview={() => setPreviewKey((k) => k + 1)}
        toggleAiAssistant={() => setIsAiOpen(!isAiOpen)}
        isAiOpen={isAiOpen}
        toggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        isNotificationsOpen={isNotificationsOpen}
        onOpenVercelModal={() => setIsVercelModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Icon Navigation Sidebar */}
        <Sidebar
          activeTab={activeSidebarTab}
          setActiveTab={setActiveSidebarTab}
          toggleAiAssistant={() => setIsAiOpen(!isAiOpen)}
          isAiOpen={isAiOpen}
        />

        {/* Left Secondary Panel */}
        <div className="w-64 h-full shrink-0">
          {activeSidebarTab === 'explorer' && <FileExplorerPanel />}
          {activeSidebarTab === 'packages' && <PackageManagerPanel />}
          {activeSidebarTab === 'assets' && <AssetsManagerPanel />}
          {activeSidebarTab === 'tasks' && <TaskManagerPanel />}
          {activeSidebarTab === 'chat' && <TeamChatPanel />}
          {activeSidebarTab === 'analytics' && <AnalyticsPanel />}
          {activeSidebarTab === 'sql' && <SqlStudioPanel />}
          {activeSidebarTab === 'git' && <GitSourceControlPanel />}
          {activeSidebarTab === 'search' && (
            <div className="h-full bg-surface-low border-r border-outline-variant/15 p-4 text-xs">
              <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px] block mb-3">GLOBAL SEARCH</span>
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="w-full py-2 px-3 bg-surface-container hover:bg-surface-high text-outline hover:text-white rounded border border-outline-variant/20 font-mono text-xs flex items-center justify-between transition-colors"
              >
                <span>Type search query...</span>
                <span className="text-[10px]">⌘K</span>
              </button>
            </div>
          )}
          {activeSidebarTab === 'graph3d' && (
            <div className="h-full bg-surface-low border-r border-outline-variant/15 p-4 text-xs space-y-2">
              <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px] block">3D ARCHITECTURE GRAPH</span>
              <p className="text-outline text-[11px] leading-relaxed">
                Nodes represent real project modules and files. Interacting with 3D nodes opens code directly in Monaco.
              </p>
            </div>
          )}
          {activeSidebarTab === 'settings' && (
            <div className="h-full bg-surface-low border-r border-outline-variant/15 p-4 text-xs space-y-2">
              <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px] block">PREFERENCES</span>
              <p className="text-outline text-[11px]">Monaco Editor, WebGL rendering & WebContainer engine active.</p>
            </div>
          )}
        </div>

        {/* Main Central Viewport (Editor / 3D / Preview / Split) */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
          <div className="flex-1 flex min-h-0 relative">
            {activeView === 'code' && (
              <div className="w-full h-full">
                <CodeEditor />
              </div>
            )}

            {activeView === '3d' && (
              <div className="w-full h-full">
                <Spatial3DWorkspace />
              </div>
            )}

            {activeView === 'preview' && (
              <div className="w-full h-full">
                <LivePreview
                  key={previewKey}
                  previewDevice={previewDevice}
                  setPreviewDevice={setPreviewDevice}
                  isRunActive={isRunActive}
                  setIsRunActive={setIsRunActive}
                />
              </div>
            )}

            {activeView === 'split' && (
              <div className="w-full h-full flex flex-col md:flex-row">
                <div className="flex-1 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-outline-variant/15">
                  <CodeEditor />
                </div>
                <div className="flex-1 h-1/2 md:h-full">
                  <Spatial3DWorkspace />
                </div>
              </div>
            )}
          </div>

          <BottomPanel terminalComponent={<Terminal />} problemsCount={0} />
        </div>

        {/* Right AI Assistant & Notification Drawers */}
        <AiAssistantDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
        <NotificationsDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />

        {/* Modals */}
        <VercelDeploymentModal isOpen={isVercelModalOpen} onClose={() => setIsVercelModalOpen(false)} />
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelectView={setActiveView}
          toggleAi={() => setIsAiOpen(!isAiOpen)}
        />
      </div>
    </div>
  );
}

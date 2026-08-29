import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { useRuntimeStore } from '../runtime/RuntimeManager';
import { useBreakpoint } from '../hooks/useBreakpoint';
import WorkspaceCompact from './WorkspaceCompact';
import {
  useLayoutStore,
  SIDEBAR_MIN,
  SIDEBAR_MAX,
  RIGHT_MIN,
  RIGHT_MAX,
  BOTTOM_MIN,
  BOTTOM_MAX,
} from '../store/useLayoutStore';

import { TopBar } from '../components/workspace/TopBar';
import { Sidebar, SidebarTab } from '../components/workspace/Sidebar';
import { StatusBar } from '../components/workspace/StatusBar';
import { ResizeHandle } from '../components/ui/ResizeHandle';
import { FileExplorerPanel } from '../components/workspace/FileExplorerPanel';
import { GitSourceControlPanel } from '../components/workspace/GitSourceControlPanel';
import { Spatial3DWorkspace } from '../components/workspace/Spatial3DWorkspace';
import { CodeEditor } from '../components/workspace/CodeEditor';
import { LivePreview } from '../components/workspace/LivePreview';
import { Terminal } from '../components/workspace/Terminal';
import { BottomPanel } from '../components/workspace/BottomPanel';
import { AiAssistantDrawer } from '../components/workspace/AiAssistantDrawer';
import { ProjectInspectorPanel } from '../components/workspace/ProjectInspectorPanel';
import { NotificationsDrawer } from '../components/workspace/NotificationsDrawer';
import { VercelDeploymentModal } from '../components/workspace/VercelDeploymentModal';
import { HelpSupportModal } from '../components/help/HelpSupportModal';
import { PackageManagerPanel } from '../components/workspace/PackageManagerPanel';
import { AssetsManagerPanel } from '../components/workspace/AssetsManagerPanel';
import { TaskManagerPanel } from '../components/workspace/TaskManagerPanel';
import { TeamChatPanel } from '../components/workspace/TeamChatPanel';
import { AnalyticsPanel } from '../components/workspace/AnalyticsPanel';
import { SqlStudioPanel } from '../components/workspace/SqlStudioPanel';
import { ShaderEditorPanel } from '../components/workspace/ShaderEditorPanel';
import { CommandPaletteModal } from '../components/workspace/CommandPaletteModal';
import { AdminPanelModal } from '../components/admin/AdminPanelModal';
import { SecurityBackupModal } from '../components/security/SecurityBackupModal';

const SIDEBAR_TITLES: Partial<Record<SidebarTab, string>> = {
  explorer: 'Explorer',
  search: 'Search',
  git: 'Source Control',
  packages: 'Packages',
  assets: 'Assets',
  tasks: 'Tasks',
  chat: 'Notes',
  analytics: 'Analytics',
  sql: 'Database',
  shader: 'Shaders',
  graph3d: '3D Graph',
  settings: 'Preferences',
};

export default function Workspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const breakpoint = useBreakpoint();

  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const saveAllFiles = useProjectStore((s) => s.saveAllFiles);

  const runtimePhase = useRuntimeStore((s) => s.phase);
  const refreshSupport = useRuntimeStore((s) => s.refreshSupport);

  const view = useLayoutStore((s) => s.view);
  const setView = useLayoutStore((s) => s.setView);
  const splitTarget = useLayoutStore((s) => s.splitTarget);
  const sidebarWidth = useLayoutStore((s) => s.sidebarWidth);
  const setSidebarWidth = useLayoutStore((s) => s.setSidebarWidth);
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const rightPanel = useLayoutStore((s) => s.rightPanel);
  const setRightPanel = useLayoutStore((s) => s.setRightPanel);
  const rightWidth = useLayoutStore((s) => s.rightWidth);
  const setRightWidth = useLayoutStore((s) => s.setRightWidth);
  const bottomHeight = useLayoutStore((s) => s.bottomHeight);
  const setBottomHeight = useLayoutStore((s) => s.setBottomHeight);
  const bottomCollapsed = useLayoutStore((s) => s.bottomCollapsed);

  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('explorer');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isRunActive, setIsRunActive] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isVercelModalOpen, setIsVercelModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSecurityBackupModalOpen, setIsSecurityBackupModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const isAiOpen = rightPanel === 'ai';

  // Only re-run when the route changes; keying this on `projects` reset the open
  // tabs on every keystroke.
  useEffect(() => {
    if (!projectId) return;
    const exists = useProjectStore.getState().projects.some((p) => p.id === projectId);
    if (exists) {
      setActiveProject(projectId);
    } else {
      navigate('/dashboard');
    }
  }, [projectId, setActiveProject, navigate]);

  useEffect(() => {
    refreshSupport();
  }, [refreshSupport]);

  // Clamp the bottom dock on short viewports so the editor keeps the majority
  // of the height, however the panel was last sized.
  useEffect(() => {
    const clamp = (): void => {
      const max = Math.round(window.innerHeight * 0.4);
      const layout = useLayoutStore.getState();
      if (layout.bottomHeight > max) layout.setBottomHeight(max);
    };
    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, []);

  // Keep the Run toggle in step with what the runtime is actually doing.
  useEffect(() => {
    setIsRunActive(
      runtimePhase === 'running' ||
        runtimePhase === 'booting' ||
        runtimePhase === 'mounting' ||
        runtimePhase === 'installing' ||
        runtimePhase === 'starting'
    );
  }, [runtimePhase]);

  // Global shortcuts, so save and the palette work outside the editor too.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && key === 's') {
        e.preventDefault();
        saveAllFiles();
      }
      if (mod && key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
      if (mod && key === 'b') {
        e.preventDefault();
        useLayoutStore.getState().toggleSidebar();
      }
      if (mod && key === 'j') {
        e.preventDefault();
        useLayoutStore.getState().toggleBottom();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saveAllFiles]);

  const currentProject = projects.find((p) => p.id === activeProjectId);

  const handleToggleRun = useCallback(async () => {
    const project = useProjectStore.getState().getActiveProject();
    if (!project) return;
    const runtime = useRuntimeStore.getState();
    const busy =
      runtime.phase === 'running' ||
      runtime.phase === 'booting' ||
      runtime.phase === 'mounting' ||
      runtime.phase === 'installing' ||
      runtime.phase === 'starting';
    if (busy) {
      await runtime.stopPreview();
    } else {
      // Starting from the editor should also reveal the preview.
      if (useLayoutStore.getState().rightPanel === null && useLayoutStore.getState().view === 'code') {
        useLayoutStore.getState().setRightPanel('preview');
      }
      await runtime.startPreview(project.id, project.files);
    }
  }, []);

  if (!currentProject) return null;

  // Phones and tablets get a purpose-built touch shell, not a squeezed desktop.
  if (breakpoint !== 'desktop') return <WorkspaceCompact breakpoint={breakpoint} />;

  const previewPane = (
    <LivePreview
      key={previewKey}
      previewDevice={previewDevice}
      setPreviewDevice={setPreviewDevice}
      isRunActive={isRunActive}
      setIsRunActive={setIsRunActive}
    />
  );

  const renderSidebarPanel = (): React.ReactNode => {
    switch (activeSidebarTab) {
      case 'explorer':
        return <FileExplorerPanel />;
      case 'packages':
        return <PackageManagerPanel />;
      case 'assets':
        return <AssetsManagerPanel />;
      case 'tasks':
        return <TaskManagerPanel />;
      case 'chat':
        return <TeamChatPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'sql':
        return <SqlStudioPanel />;
      case 'shader':
        return <ShaderEditorPanel />;
      case 'git':
        return <GitSourceControlPanel />;
      case 'search':
        return (
          <div className="h-full bg-surface-low p-3 text-xs">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-full py-2 px-3 bg-[#121215] hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg border border-white/10 font-mono text-xs flex items-center justify-between transition-colors"
            >
              <span>Search files…</span>
              <span className="text-[10px]">⌘K</span>
            </button>
            <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed">
              The command palette searches every file in the project by path.
            </p>
          </div>
        );
      case 'graph3d':
        return (
          <div className="h-full bg-surface-low p-3 text-xs space-y-3">
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              The spatial graph maps this project's real file tree. Selecting a node opens the file in the editor.
            </p>
            <button
              onClick={() => setView('3d')}
              className="w-full py-2 px-3 bg-[#ef233c] hover:bg-[#d90429] text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Open 3D workspace
            </button>
            <button
              onClick={() => setView('split')}
              className="w-full py-2 px-3 bg-[#121215] hover:bg-white/5 text-zinc-300 rounded-lg border border-white/10 text-xs transition-colors"
            >
              Open beside the editor
            </button>
          </div>
        );
      case 'settings':
        return (
          <div className="h-full bg-surface-low p-3 text-xs space-y-3">
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Editor, provider and rendering preferences live on the dashboard settings tab.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2 px-3 bg-[#121215] hover:bg-white/5 text-zinc-300 rounded-lg border border-white/10 text-xs transition-colors"
            >
              Open settings
            </button>
            <button
              onClick={() => useLayoutStore.getState().resetLayout()}
              className="w-full py-2 px-3 bg-[#121215] hover:bg-white/5 text-zinc-300 rounded-lg border border-white/10 text-xs transition-colors"
            >
              Reset panel layout
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-zinc-200 overflow-hidden font-sans">
      <TopBar
        activeView={view}
        setActiveView={setView}
        previewDevice={previewDevice}
        setPreviewDevice={setPreviewDevice}
        isRunActive={isRunActive}
        onToggleRun={handleToggleRun}
        onRefreshPreview={() => setPreviewKey((k) => k + 1)}
        toggleAiAssistant={() => setRightPanel(isAiOpen ? null : 'ai')}
        isAiOpen={isAiOpen}
        toggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        isNotificationsOpen={isNotificationsOpen}
        onOpenVercelModal={() => setIsVercelModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenSecurityBackupModal={() => setIsSecurityBackupModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar
          activeTab={activeSidebarTab}
          setActiveTab={(tab) => {
            // Clicking the active icon collapses the panel, like a real IDE.
            if (tab === activeSidebarTab && !sidebarCollapsed) {
              toggleSidebar();
              return;
            }
            setActiveSidebarTab(tab);
            if (sidebarCollapsed) toggleSidebar();
          }}
          toggleAiAssistant={() => setRightPanel(isAiOpen ? null : 'ai')}
          isAiOpen={isAiOpen}
        />

        {!sidebarCollapsed && (
          <>
            <aside
              style={{ width: sidebarWidth }}
              className="h-full shrink-0 flex flex-col min-h-0 bg-surface-low border-r border-white/10"
            >
              <div className="h-8 shrink-0 px-3 flex items-center justify-between border-b border-white/10">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {SIDEBAR_TITLES[activeSidebarTab] ?? activeSidebarTab}
                </span>
                <button
                  onClick={toggleSidebar}
                  className="p-0.5 text-zinc-500 hover:text-white rounded transition-colors"
                  title="Collapse sidebar (Ctrl/Cmd+B)"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">{renderSidebarPanel()}</div>
            </aside>
            <ResizeHandle
              direction="horizontal"
              size={sidebarWidth}
              onResize={setSidebarWidth}
              min={SIDEBAR_MIN}
              max={SIDEBAR_MAX}
              onDoubleClick={toggleSidebar}
              label="Resize sidebar"
            />
          </>
        )}

        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-6 shrink-0 flex items-start justify-center pt-2 bg-surface-low border-r border-white/10 text-zinc-500 hover:text-white transition-colors"
            title="Expand sidebar (Ctrl/Cmd+B)"
          >
            <PanelLeftOpen className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Centre column: editor stack over the bottom panel. */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Each view fills the pane: flex children need an explicit basis or
              they collapse to their content width. */}
          <div className="flex-1 flex min-h-0 min-w-0">
            {view === 'code' && (
              <div className="flex-1 min-w-0 h-full">
                <CodeEditor />
              </div>
            )}

            {view === '3d' && (
              <div className="flex-1 min-w-0 h-full">
                <Spatial3DWorkspace />
              </div>
            )}

            {view === 'preview' && <div className="flex-1 min-w-0 h-full">{previewPane}</div>}

            {view === 'split' && (
              <>
                <div className="flex-1 min-w-0 h-full border-r border-white/10">
                  <CodeEditor />
                </div>
                <div className="flex-1 min-w-0 h-full">
                  {splitTarget === 'preview' ? previewPane : <Spatial3DWorkspace />}
                </div>
              </>
            )}
          </div>

          {!bottomCollapsed && (
            <ResizeHandle
              direction="vertical"
              size={bottomHeight}
              onResize={setBottomHeight}
              min={BOTTOM_MIN}
              max={BOTTOM_MAX}
              invert
              onDoubleClick={() => useLayoutStore.getState().toggleBottom()}
              label="Resize bottom panel"
            />
          )}
          <BottomPanel terminalComponent={<Terminal />} />
        </div>

        {/* Docked right panel. */}
        {rightPanel && (
          <>
            <ResizeHandle
              direction="horizontal"
              size={rightWidth}
              onResize={setRightWidth}
              min={RIGHT_MIN}
              max={RIGHT_MAX}
              invert
              label="Resize right panel"
            />
            <aside
              style={{ width: rightWidth }}
              className="h-full shrink-0 flex flex-col min-h-0 bg-surface-low border-l border-white/10"
            >
              <div className="h-8 shrink-0 px-2 flex items-center gap-1 border-b border-white/10">
                {(['preview', 'ai', 'inspector'] as const).map((panel) => (
                  <button
                    key={panel}
                    onClick={() => setRightPanel(panel)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                      rightPanel === panel
                        ? 'bg-[#ef233c]/15 text-[#ef233c]'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {panel}
                  </button>
                ))}
                <button
                  onClick={() => setRightPanel(null)}
                  className="ml-auto p-0.5 text-zinc-500 hover:text-white rounded transition-colors"
                  title="Close panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {rightPanel === 'preview' && previewPane}
                {rightPanel === 'ai' && <AiAssistantDrawer isOpen docked onClose={() => setRightPanel(null)} />}
                {rightPanel === 'inspector' && <ProjectInspectorPanel />}
              </div>
            </aside>
          </>
        )}

        <NotificationsDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      </div>

      <StatusBar />

      <VercelDeploymentModal isOpen={isVercelModalOpen} onClose={() => setIsVercelModalOpen(false)} />
      <HelpSupportModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      <AdminPanelModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
      <SecurityBackupModal
        isOpen={isSecurityBackupModalOpen}
        onClose={() => setIsSecurityBackupModalOpen(false)}
      />
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={setView}
        toggleAi={() => setRightPanel(isAiOpen ? null : 'ai')}
      />
    </div>
  );
}

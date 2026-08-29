import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * What occupies the centre of the workspace.
 *
 * `code` is the default: the 3D scene is a differentiator, not the place you
 * write code from, so it never takes the centre unless explicitly selected.
 */
export type WorkspaceView = 'code' | 'split' | '3d' | 'preview';

/** What the docked right-hand panel shows, or null when it is collapsed. */
export type RightPanel = 'preview' | 'ai' | 'inspector' | null;

export type BottomTab = 'terminal' | 'problems' | 'output' | 'git';

interface LayoutState {
  view: WorkspaceView;
  /** Which pane the split view puts beside the editor. */
  splitTarget: 'preview' | '3d';

  sidebarWidth: number;
  sidebarCollapsed: boolean;

  rightPanel: RightPanel;
  rightWidth: number;

  bottomHeight: number;
  bottomCollapsed: boolean;
  bottomTab: BottomTab;

  setView: (view: WorkspaceView) => void;
  setSplitTarget: (target: 'preview' | '3d') => void;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  setRightPanel: (panel: RightPanel) => void;
  setRightWidth: (width: number) => void;
  setBottomHeight: (height: number) => void;
  toggleBottom: () => void;
  setBottomTab: (tab: BottomTab) => void;
  /** Opens the bottom panel on a given tab, expanding it if collapsed. */
  showBottomTab: (tab: BottomTab) => void;
  resetLayout: () => void;
}

export const SIDEBAR_MIN = 180;
export const SIDEBAR_MAX = 480;
export const RIGHT_MIN = 280;
export const RIGHT_MAX = 900;
export const BOTTOM_MIN = 120;
export const BOTTOM_MAX = 640;

const DEFAULTS = {
  view: 'code' as WorkspaceView,
  splitTarget: 'preview' as const,
  sidebarWidth: 248,
  sidebarCollapsed: false,
  rightPanel: null as RightPanel,
  rightWidth: 420,
  bottomHeight: 220,
  bottomCollapsed: false,
  bottomTab: 'terminal' as BottomTab,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.round(value)));

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setView: (view) => set({ view }),
      setSplitTarget: (splitTarget) => set({ splitTarget }),

      setSidebarWidth: (width) => set({ sidebarWidth: clamp(width, SIDEBAR_MIN, SIDEBAR_MAX) }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setRightPanel: (rightPanel) => set({ rightPanel }),
      setRightWidth: (width) => set({ rightWidth: clamp(width, RIGHT_MIN, RIGHT_MAX) }),

      setBottomHeight: (height) => set({ bottomHeight: clamp(height, BOTTOM_MIN, BOTTOM_MAX) }),
      toggleBottom: () => set((s) => ({ bottomCollapsed: !s.bottomCollapsed })),
      setBottomTab: (bottomTab) => set({ bottomTab }),
      showBottomTab: (bottomTab) => set({ bottomTab, bottomCollapsed: false }),

      resetLayout: () => set({ ...DEFAULTS }),
    }),
    { name: 'codespace-3d-layout', version: 1 }
  )
);

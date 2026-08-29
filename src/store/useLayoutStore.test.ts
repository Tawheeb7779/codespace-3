import { describe, it, expect, beforeEach } from 'vitest';
import {
  useLayoutStore,
  SIDEBAR_MIN,
  SIDEBAR_MAX,
  BOTTOM_MIN,
  BOTTOM_MAX,
  RIGHT_MIN,
  RIGHT_MAX,
} from './useLayoutStore';

describe('useLayoutStore', () => {
  beforeEach(() => {
    useLayoutStore.getState().resetLayout();
  });

  it('defaults to the code view so the editor, not the 3D scene, is the focus', () => {
    const state = useLayoutStore.getState();
    expect(state.view).toBe('code');
    expect(state.splitTarget).toBe('preview');
    expect(state.rightPanel).toBeNull();
    expect(state.bottomCollapsed).toBe(false);
  });

  it('clamps panel sizes to their usable range', () => {
    const store = useLayoutStore.getState();

    store.setSidebarWidth(10);
    expect(useLayoutStore.getState().sidebarWidth).toBe(SIDEBAR_MIN);
    store.setSidebarWidth(9999);
    expect(useLayoutStore.getState().sidebarWidth).toBe(SIDEBAR_MAX);

    store.setBottomHeight(0);
    expect(useLayoutStore.getState().bottomHeight).toBe(BOTTOM_MIN);
    store.setBottomHeight(9999);
    expect(useLayoutStore.getState().bottomHeight).toBe(BOTTOM_MAX);

    store.setRightWidth(1);
    expect(useLayoutStore.getState().rightWidth).toBe(RIGHT_MIN);
    store.setRightWidth(9999);
    expect(useLayoutStore.getState().rightWidth).toBe(RIGHT_MAX);
  });

  it('rounds fractional sizes from pointer drags', () => {
    useLayoutStore.getState().setSidebarWidth(263.7);
    expect(useLayoutStore.getState().sidebarWidth).toBe(264);
  });

  it('toggles the sidebar and bottom panel', () => {
    useLayoutStore.getState().toggleSidebar();
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(true);
    useLayoutStore.getState().toggleSidebar();
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(false);

    useLayoutStore.getState().toggleBottom();
    expect(useLayoutStore.getState().bottomCollapsed).toBe(true);
  });

  it('showBottomTab expands a collapsed panel onto the requested tab', () => {
    useLayoutStore.getState().toggleBottom();
    expect(useLayoutStore.getState().bottomCollapsed).toBe(true);

    useLayoutStore.getState().showBottomTab('problems');
    const state = useLayoutStore.getState();
    expect(state.bottomCollapsed).toBe(false);
    expect(state.bottomTab).toBe('problems');
  });

  it('resetLayout restores every default', () => {
    const store = useLayoutStore.getState();
    store.setView('3d');
    store.setRightPanel('ai');
    store.setSidebarWidth(SIDEBAR_MAX);
    store.toggleBottom();

    useLayoutStore.getState().resetLayout();

    const state = useLayoutStore.getState();
    expect(state.view).toBe('code');
    expect(state.rightPanel).toBeNull();
    expect(state.sidebarWidth).toBe(248);
    expect(state.bottomCollapsed).toBe(false);
  });
});

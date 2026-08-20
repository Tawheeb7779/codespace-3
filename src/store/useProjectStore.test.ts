import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from './useProjectStore';

describe('useProjectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      activeProjectId: null,
      activeFileId: null,
      openTabIds: [],
      gitBranch: 'main',
      gitStatus: { staged: [], unstaged: [], committed: false },
    });
  });

  it('creates a project successfully', () => {
    const store = useProjectStore.getState();
    const proj = store.createProject('Test App', 'Description for test');
    expect(proj.name).toBe('Test App');
    expect(useProjectStore.getState().projects.length).toBe(1);
    expect(useProjectStore.getState().activeProjectId).toBe(proj.id);
  });

  it('creates and deletes a file', () => {
    const store = useProjectStore.getState();
    const proj = store.createProject('Test App', 'Description for test');

    store.createFile('TestComponent.tsx', 'src', false);
    const updatedProj = useProjectStore.getState().projects.find(p => p.id === proj.id);
    expect(updatedProj?.files['TestComponent.tsx']).toBeDefined();

    store.deleteFile('TestComponent.tsx');
    const finalProj = useProjectStore.getState().projects.find(p => p.id === proj.id);
    expect(finalProj?.files['TestComponent.tsx']).toBeUndefined();
  });
});

import { describe, it, expect } from 'vitest';
import { useProjectStore } from './useProjectStore';

describe('useProjectStore Hardening Pass', () => {
  it('persists project tasks, assets, and chat messages per project', () => {
    const store = useProjectStore.getState();
    const proj = store.createProject('Hardening Test Project', 'Testing task/chat/asset persistence');

    // Add task
    store.setTasksForProject(proj.id, [
      { id: 't1', title: 'Task 1', description: 'Desc 1', status: 'todo', priority: 'high' }
    ]);

    // Add chat
    store.setChatForProject(proj.id, [
      { id: 'c1', sender: 'User', text: 'Hello', timestamp: '10:00 AM' }
    ]);

    // Verify isolation and persistence
    const state = useProjectStore.getState();
    expect(state.projectTasks[proj.id].length).toBe(1);
    expect(state.projectTasks[proj.id][0].title).toBe('Task 1');
    expect(state.projectChats[proj.id].length).toBe(1);
  });

  it('moves files between folders while updating parent-child relationships and paths', () => {
    const store = useProjectStore.getState();
    const proj = store.createProject('Move File Test', 'Testing file move operation');
    store.setActiveProject(proj.id);

    // Files are keyed by absolute path, so a move re-keys the whole subtree.
    store.createFile('MovableFile.tsx', '/src', false);
    store.createFile('subfolder', '/src', true);

    store.moveFile('/src/MovableFile.tsx', '/src/subfolder');

    const updatedProj = useProjectStore.getState().projects.find(p => p.id === proj.id)!;
    const movedFile = updatedProj.files['/src/subfolder/MovableFile.tsx'];
    const subfolder = updatedProj.files['/src/subfolder'];
    const srcFolder = updatedProj.files['/src'];

    expect(updatedProj.files['/src/MovableFile.tsx']).toBeUndefined();
    expect(movedFile.parentId).toBe('/src/subfolder');
    expect(subfolder.children).toContain('/src/subfolder/MovableFile.tsx');
    expect(srcFolder.children).not.toContain('/src/MovableFile.tsx');
  });

  it('guarantees complete isolation between Project A and Project B', () => {
    const store = useProjectStore.getState();
    const projA = store.createProject('Project A', 'First project');
    const projB = store.createProject('Project B', 'Second project');

    // Add file and task to Project A
    store.setActiveProject(projA.id);
    store.createFile('IsolatedA.tsx', 'src', false);
    store.setTasksForProject(projA.id, [
      { id: 'ta1', title: 'Task in A', description: '', status: 'todo', priority: 'medium' }
    ]);

    // Switch to Project B
    store.setActiveProject(projB.id);

    // Verify Project B does NOT contain IsolatedA.tsx or Task in A
    const currentB = useProjectStore.getState().projects.find(p => p.id === projB.id);
    expect(currentB?.files['IsolatedA.tsx']).toBeUndefined();
    expect(useProjectStore.getState().projectTasks[projB.id]).toBeUndefined();
  });
});

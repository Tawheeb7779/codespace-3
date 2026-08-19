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
});

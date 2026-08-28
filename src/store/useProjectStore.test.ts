import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from './useProjectStore';
import { createTemplateFiles } from './projectTemplates';
import { ROOT_ID } from '../lib/paths';

function resetStore(): void {
  useProjectStore.setState({
    projects: [
      {
        id: 'test-project',
        name: 'Test Project',
        description: '',
        updatedAt: new Date().toISOString(),
        template: 'react-three',
        branch: 'main',
        files: createTemplateFiles('react-three'),
      },
    ],
    activeProjectId: 'test-project',
    activeFileId: '/src/App.jsx',
    openTabIds: ['/src/App.jsx'],
    gitBranch: 'main',
    gitStatus: { staged: [], unstaged: [], committed: false },
    currentUserRole: 'owner',
  });
}

describe('useProjectStore', () => {
  beforeEach(resetStore);

  it('creates a project with an independent file tree', () => {
    const proj = useProjectStore.getState().createProject('Test App', 'Description');
    expect(proj.name).toBe('Test App');
    expect(useProjectStore.getState().activeProjectId).toBe(proj.id);
    expect(proj.files[ROOT_ID]).toBeDefined();
    expect(proj.files['/package.json']).toBeDefined();
  });

  it('creates and deletes a file, keyed by absolute path', () => {
    const store = useProjectStore.getState();
    const created = store.createFile('TestComponent.tsx', '/src', false);

    expect(created.ok).toBe(true);
    expect(created.id).toBe('/src/TestComponent.tsx');

    const project = () => useProjectStore.getState().projects[0];
    expect(project().files['/src/TestComponent.tsx']).toBeDefined();
    expect(project().files['/src'].children).toContain('/src/TestComponent.tsx');
    expect(useProjectStore.getState().openTabIds).toContain('/src/TestComponent.tsx');

    useProjectStore.getState().deleteFile('/src/TestComponent.tsx');
    expect(project().files['/src/TestComponent.tsx']).toBeUndefined();
    expect(project().files['/src'].children).not.toContain('/src/TestComponent.tsx');
    expect(useProjectStore.getState().openTabIds).not.toContain('/src/TestComponent.tsx');
  });

  it('allows the same file name in different folders', () => {
    const store = useProjectStore.getState();
    const a = store.createFile('index.js', '/src', false);
    const b = useProjectStore.getState().createFile('index.js', '/public', false);

    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(a.id).not.toBe(b.id);

    const files = useProjectStore.getState().projects[0].files;
    expect(files['/src/index.js']).toBeDefined();
    expect(files['/public/index.js']).toBeDefined();
  });

  it('rejects duplicate names and invalid names in the same folder', () => {
    const store = useProjectStore.getState();
    store.createFile('dupe.ts', '/src', false);

    expect(useProjectStore.getState().createFile('dupe.ts', '/src', false).ok).toBe(false);
    expect(useProjectStore.getState().createFile('a/b.ts', '/src', false).ok).toBe(false);
    expect(useProjectStore.getState().createFile('   ', '/src', false).ok).toBe(false);
  });

  it('detects the language from the file extension', () => {
    useProjectStore.getState().createFile('styles.css', '/src', false);
    useProjectStore.getState().createFile('data.json', '/src', false);
    const files = useProjectStore.getState().projects[0].files;
    expect(files['/src/styles.css'].language).toBe('css');
    expect(files['/src/data.json'].language).toBe('json');
  });

  it('renaming a folder rewrites every descendant path', () => {
    const store = useProjectStore.getState();
    store.openFile('/src/components/Scene3D.jsx');

    const result = useProjectStore.getState().renameFile('/src/components', 'widgets');
    expect(result.ok).toBe(true);

    const files = useProjectStore.getState().projects[0].files;
    expect(files['/src/components']).toBeUndefined();
    expect(files['/src/components/Scene3D.jsx']).toBeUndefined();
    expect(files['/src/widgets/Scene3D.jsx']).toBeDefined();
    expect(files['/src/widgets/Scene3D.jsx'].parentId).toBe('/src/widgets');
    expect(files['/src/widgets'].children).toContain('/src/widgets/Scene3D.jsx');
    expect(files['/src'].children).toContain('/src/widgets');
    expect(files['/src'].children).not.toContain('/src/components');

    // Open tabs and the active file must follow the rename.
    expect(useProjectStore.getState().openTabIds).toContain('/src/widgets/Scene3D.jsx');
    expect(useProjectStore.getState().activeFileId).toBe('/src/widgets/Scene3D.jsx');
  });

  it('renaming a file updates its language', () => {
    useProjectStore.getState().createFile('notes.txt', '/src', false);
    const result = useProjectStore.getState().renameFile('/src/notes.txt', 'notes.md');
    expect(result.ok).toBe(true);
    expect(useProjectStore.getState().projects[0].files['/src/notes.md'].language).toBe('markdown');
  });

  it('deleting a folder removes the whole subtree', () => {
    const store = useProjectStore.getState();
    store.openFile('/src/components/Header.jsx');

    useProjectStore.getState().deleteFile('/src/components');

    const files = useProjectStore.getState().projects[0].files;
    expect(files['/src/components']).toBeUndefined();
    expect(files['/src/components/Header.jsx']).toBeUndefined();
    expect(files['/src/components/Scene3D.jsx']).toBeUndefined();
    expect(useProjectStore.getState().openTabIds).not.toContain('/src/components/Header.jsx');
  });

  it('moves a file into another folder', () => {
    useProjectStore.getState().createFile('util.js', '/src', false);
    const result = useProjectStore.getState().moveFile('/src/util.js', '/src/components');

    expect(result.ok).toBe(true);
    const files = useProjectStore.getState().projects[0].files;
    expect(files['/src/util.js']).toBeUndefined();
    expect(files['/src/components/util.js']).toBeDefined();
    expect(files['/src'].children).not.toContain('/src/util.js');
    expect(files['/src/components'].children).toContain('/src/components/util.js');
  });

  it('refuses to move a folder inside itself', () => {
    const result = useProjectStore.getState().moveFile('/src', '/src/components');
    expect(result.ok).toBe(false);
    expect(useProjectStore.getState().projects[0].files['/src']).toBeDefined();
  });

  it('marks a file unsaved on edit and clears the flag on save', () => {
    useProjectStore.getState().updateFileContent('/src/App.jsx', 'const x = 1;');

    let file = useProjectStore.getState().projects[0].files['/src/App.jsx'];
    expect(file.content).toBe('const x = 1;');
    expect(file.isUnsaved).toBe(true);
    expect(useProjectStore.getState().gitStatus.unstaged).toContain('/src/App.jsx');

    useProjectStore.getState().saveFile('/src/App.jsx');
    file = useProjectStore.getState().projects[0].files['/src/App.jsx'];
    expect(file.isUnsaved).toBe(false);
    expect(file.content).toBe('const x = 1;');
  });

  it('saveAllFiles clears every dirty flag', () => {
    useProjectStore.getState().updateFileContent('/src/App.jsx', 'a');
    useProjectStore.getState().updateFileContent('/README.md', 'b');

    useProjectStore.getState().saveAllFiles();

    const files = useProjectStore.getState().projects[0].files;
    expect(files['/src/App.jsx'].isUnsaved).toBe(false);
    expect(files['/README.md'].isUnsaved).toBe(false);
  });

  it('closing the active tab activates a neighbouring tab', () => {
    const store = useProjectStore.getState();
    store.openFile('/README.md');
    store.openFile('/src/components/Header.jsx');
    expect(useProjectStore.getState().activeFileId).toBe('/src/components/Header.jsx');

    useProjectStore.getState().closeTab('/src/components/Header.jsx');
    const state = useProjectStore.getState();
    expect(state.openTabIds).not.toContain('/src/components/Header.jsx');
    expect(state.activeFileId).toBe('/README.md');
  });

  it('does not open folders as editor tabs', () => {
    useProjectStore.getState().openFile('/src');
    expect(useProjectStore.getState().openTabIds).not.toContain('/src');
  });

  it('viewers cannot mutate the file tree', () => {
    useProjectStore.setState({ currentUserRole: 'viewer' });

    expect(useProjectStore.getState().createFile('blocked.ts', '/src', false).ok).toBe(false);
    expect(useProjectStore.getState().deleteFile('/README.md').ok).toBe(false);
    expect(useProjectStore.getState().renameFile('/README.md', 'other.md').ok).toBe(false);

    useProjectStore.getState().updateFileContent('/README.md', 'nope');
    expect(useProjectStore.getState().projects[0].files['/README.md'].content).not.toBe('nope');
  });

  it('keeps the open tabs when re-activating the project already open', () => {
    const store = useProjectStore.getState();
    store.openFile('/README.md');
    const before = useProjectStore.getState().openTabIds;

    useProjectStore.getState().setActiveProject('test-project');
    expect(useProjectStore.getState().openTabIds).toEqual(before);
  });
});

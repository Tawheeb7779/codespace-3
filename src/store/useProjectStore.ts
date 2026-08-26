import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, ProjectFile } from '../types';
import { WorkspaceTask, ChatMessage, ProjectAsset } from '../types/stitch';
import { RuntimeFilesystemBridge } from '../runtime/RuntimeFilesystemBridge';
import { useAuthStore } from './useAuthStore';

export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer';

export interface ExtendedProject extends Project {
  userId?: string;
  visibility?: 'public' | 'private';
}

export const DEFAULT_ROOT_FILE_IDS = [
  'index.html',
  'package.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'src',
  'public',
  'README.md',
];

export const DEFAULT_REACT_THREE_FILES: Record<string, ProjectFile> = {
  'root': { id: 'root', name: 'root', path: '/', content: '', language: '', isFolder: true, parentId: null, children: [...DEFAULT_ROOT_FILE_IDS] },
  'src': { id: 'src', name: 'src', path: '/src', content: '', language: '', isFolder: true, parentId: 'root', children: ['App.tsx', 'main.tsx', 'index.css', 'components'] },
  'public': { id: 'public', name: 'public', path: '/public', content: '', language: '', isFolder: true, parentId: 'root', children: ['assets'] },
  'assets': { id: 'assets', name: 'assets', path: '/public/assets', content: '', language: '', isFolder: true, parentId: 'public', children: [] },
  'components': { id: 'components', name: 'components', path: '/src/components', content: '', language: '', isFolder: true, parentId: 'src', children: ['Scene3D.tsx', 'Header.tsx'] },
  'App.tsx': {
    id: 'App.tsx',
    name: 'App.tsx',
    path: '/src/App.tsx',
    language: 'typescript',
    isFolder: false,
    parentId: 'src',
    content: `import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Scene3D } from './components/Scene3D';
import { Header } from './components/Header';

export default function App() {
  const [activeNode, setActiveNode] = useState<string | null>('root');

  return (
    <div className="app-shell">
      <Header title="CodeSpace 3D Canvas" />
      <div className="canvas-wrap">
        <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Scene3D activeNode={activeNode} onSelectNode={setActiveNode} />
          <OrbitControls enablePan={true} enableZoom={true} />
        </Canvas>
      </div>
      <footer className="app-footer">
        Selected node: <strong>{activeNode ?? 'none'}</strong>
      </footer>
    </div>
  );
}`
  },
  'main.tsx': {
    id: 'main.tsx',
    name: 'main.tsx',
    path: '/src/main.tsx',
    language: 'typescript',
    isFolder: false,
    parentId: 'src',
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
  },
  'index.css': {
    id: 'index.css',
    name: 'index.css',
    path: '/src/index.css',
    language: 'css',
    isFolder: false,
    parentId: 'src',
    content: `:root {
  color-scheme: dark;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0e131d;
  color: #dee2f1;
}

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.canvas-wrap {
  flex: 1;
  position: relative;
  min-height: 0;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #131a27;
  border-bottom: 1px solid #1f2937;
}

.app-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #4d8eff;
}

.app-header span {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  color: #94a3b8;
}

.app-footer {
  padding: 8px 24px;
  font-size: 12px;
  background: #131a27;
  border-top: 1px solid #1f2937;
  color: #94a3b8;
}`
  },
  'Scene3D.tsx': {
    id: 'Scene3D.tsx',
    name: 'Scene3D.tsx',
    path: '/src/components/Scene3D.tsx',
    language: 'typescript',
    isFolder: false,
    parentId: 'components',
    content: `import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Scene3DProps {
  activeNode: string | null;
  onSelectNode: (node: string) => void;
}

export function Scene3D({ activeNode, onSelectNode }: Scene3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <mesh
      ref={meshRef}
      onClick={() => onSelectNode('cube')}
      scale={activeNode === 'cube' ? 1.2 : 1}
    >
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color={activeNode === 'cube' ? '#4d8eff' : '#a4c9ff'} wireframe />
    </mesh>
  );
}`
  },
  'Header.tsx': {
    id: 'Header.tsx',
    name: 'Header.tsx',
    path: '/src/components/Header.tsx',
    language: 'typescript',
    isFolder: false,
    parentId: 'components',
    content: `export function Header({ title }: { title: string }) {
  return (
    <header className="app-header">
      <h1>{title}</h1>
      <span>v1.0.0</span>
    </header>
  );
}`
  },
  'package.json': {
    id: 'package.json',
    name: 'package.json',
    path: '/package.json',
    language: 'json',
    isFolder: false,
    parentId: 'root',
    content: `{
  "name": "codespace-3d-demo",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-three/drei": "9.105.6",
    "@react-three/fiber": "8.16.6",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "three": "0.164.1"
  },
  "devDependencies": {
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "@types/three": "0.164.0",
    "@vitejs/plugin-react": "4.3.1",
    "typescript": "5.4.5",
    "vite": "5.2.11"
  }
}`
  },
  'index.html': {
    id: 'index.html',
    name: 'index.html',
    path: '/index.html',
    language: 'html',
    isFolder: false,
    parentId: 'root',
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeSpace 3D Canvas</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  },
  'vite.config.ts': {
    id: 'vite.config.ts',
    name: 'vite.config.ts',
    path: '/vite.config.ts',
    language: 'typescript',
    isFolder: false,
    parentId: 'root',
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});`
  },
  'tsconfig.json': {
    id: 'tsconfig.json',
    name: 'tsconfig.json',
    path: '/tsconfig.json',
    language: 'json',
    isFolder: false,
    parentId: 'root',
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`
  },
  'tsconfig.node.json': {
    id: 'tsconfig.node.json',
    name: 'tsconfig.node.json',
    path: '/tsconfig.node.json',
    language: 'json',
    isFolder: false,
    parentId: 'root',
    content: `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}`
  },
  'README.md': {
    id: 'README.md',
    name: 'README.md',
    path: '/README.md',
    language: 'markdown',
    isFolder: false,
    parentId: 'root',
    content: `# CodeSpace 3D Workspace

A Vite + React + TypeScript + React Three Fiber starter that runs inside the
CodeSpace 3D WebContainer runtime.

\`\`\`bash
npm install
npm run dev
\`\`\`
`
  }
};

const SCAFFOLD_FILE_IDS = ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.node.json'];

/**
 * Adds the Vite scaffolding (index.html, vite config, tsconfigs, package.json scripts)
 * to projects persisted before the template became a runnable Vite project.
 * User-authored source files are left untouched.
 */
const upgradeProjectToViteScaffold = (project: ExtendedProject): ExtendedProject => {
  const files: Record<string, ProjectFile> = { ...project.files };
  const rootFileIds = [...(project.rootFileIds || [])];
  let changed = false;

  SCAFFOLD_FILE_IDS.forEach(id => {
    if (files[id]) return;
    files[id] = JSON.parse(JSON.stringify(DEFAULT_REACT_THREE_FILES[id]));
    if (!rootFileIds.includes(id)) rootFileIds.push(id);
    changed = true;
  });

  const pkg = files['package.json'];
  if (!pkg || !pkg.content.includes('"scripts"')) {
    files['package.json'] = JSON.parse(JSON.stringify(DEFAULT_REACT_THREE_FILES['package.json']));
    if (!rootFileIds.includes('package.json')) rootFileIds.push('package.json');
    changed = true;
  }

  if (!changed) return project;

  const root = files['root'];
  if (root) {
    files['root'] = {
      ...root,
      children: Array.from(new Set([...(root.children || []), ...rootFileIds])),
    };
  }

  return { ...project, files, rootFileIds };
};

const DEFAULT_PROJECTS: ExtendedProject[] = [
  {
    id: 'demo-3d-app',
    name: '3D Spatial App',
    description: 'Interactive Three.js and React Three Fiber spatial project with 3D nodes',
    updatedAt: new Date().toISOString(),
    template: 'react-three',
    branch: 'main',
    files: DEFAULT_REACT_THREE_FILES,
    rootFileIds: [...DEFAULT_ROOT_FILE_IDS],
    userId: 'guest-local',
    visibility: 'public',
  }
];

interface ProjectState {
  projects: ExtendedProject[];
  activeProjectId: string | null;
  activeFileId: string | null;
  openTabIds: string[];
  gitBranch: string;
  gitStatus: { staged: string[]; unstaged: string[]; committed: boolean };
  githubRepo: string | null;
  githubConnected: boolean;

  // RBAC User Role per project
  currentUserRole: UserRole;

  // Stitch feature persistent state per project
  projectTasks: Record<string, WorkspaceTask[]>;
  projectChats: Record<string, ChatMessage[]>;
  projectAssets: Record<string, ProjectAsset[]>;

  // Actions
  setActiveProject: (id: string) => void;
  createProject: (name: string, description: string, template?: Project['template']) => ExtendedProject;
  deleteProject: (id: string) => void;
  openFile: (fileId: string) => void;
  closeTab: (fileId: string) => void;
  saveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  createFile: (name: string, parentId?: string | null, isFolder?: boolean) => void;
  deleteFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => void;
  moveFile: (fileId: string, newParentId: string) => void;
  setGithubRepo: (repo: string | null) => void;
  setGithubConnected: (connected: boolean) => void;
  setUserRole: (role: UserRole) => void;
  stageFile: (filePath: string) => void;
  unstageFile: (filePath: string) => void;
  commitChanges: (message: string) => void;

  // Task & Chat & Asset persistence actions
  setTasksForProject: (projectId: string, tasks: WorkspaceTask[]) => void;
  setChatForProject: (projectId: string, messages: ChatMessage[]) => void;
  setAssetsForProject: (projectId: string, assets: ProjectAsset[]) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: DEFAULT_PROJECTS,
      activeProjectId: 'demo-3d-app',
      activeFileId: 'App.tsx',
      openTabIds: ['App.tsx', 'Scene3D.tsx', 'README.md'],
      gitBranch: 'main',
      gitStatus: { staged: [], unstaged: ['App.tsx'], committed: false },
      githubRepo: null,
      githubConnected: false,
      currentUserRole: 'owner',

      projectTasks: {
        'demo-3d-app': [
          { id: '1', title: 'Implement 3D Node Mesh Orbiting', description: 'Refactor R3F rotation frame loops', status: 'in_progress', priority: 'high', assignedTo: 'Jules' },
          { id: '2', title: 'WebContainer COOP/COEP Headers', description: 'Enable SharedArrayBuffer cross-origin isolation', status: 'completed', priority: 'high', assignedTo: 'DevOps' }
        ]
      },
      projectChats: {
        'demo-3d-app': [
          { id: '1', sender: 'Nexus AI', text: '3D Spatial Graph nodes compiled. 12 file nodes mounted.', timestamp: '10:14 AM', isAi: true }
        ]
      },
      projectAssets: {
        'demo-3d-app': [
          { id: '1', name: 'robot_avatar.gltf', type: '3d-model', size: '2.4 MB', url: '/public/assets/robot_avatar.gltf', updatedAt: '2026-02-18' }
        ]
      },

      setActiveProject: (id) => {
        const project = get().projects.find(p => p.id === id);
        if (project) {
          const firstFile = Object.values(project.files).find(f => !f.isFolder);
          set({
            activeProjectId: id,
            activeFileId: firstFile ? firstFile.id : null,
            openTabIds: firstFile ? [firstFile.id] : [],
            gitBranch: project.branch || 'main',
          });
          RuntimeFilesystemBridge.initializeProject(project.files);
        }
      },

      createProject: (name, description, template = 'react-three') => {
        const currentUser = useAuthStore.getState().user;
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
        const newProject: ExtendedProject = {
          id,
          name,
          description,
          updatedAt: new Date().toISOString(),
          template,
          branch: 'main',
          files: JSON.parse(JSON.stringify(DEFAULT_REACT_THREE_FILES)),
          rootFileIds: [...DEFAULT_ROOT_FILE_IDS],
          userId: currentUser?.id || 'guest-local',
          visibility: 'private',
        };
        set(state => ({
          projects: [newProject, ...state.projects],
          activeProjectId: id,
          activeFileId: 'App.tsx',
          openTabIds: ['App.tsx'],
        }));
        RuntimeFilesystemBridge.initializeProject(newProject.files);
        return newProject;
      },

      deleteProject: (id) => {
        if (get().currentUserRole === 'viewer') return; // RBAC Guard
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          activeProjectId: state.activeProjectId === id ? (state.projects[0]?.id || null) : state.activeProjectId,
        }));
      },

      openFile: (fileId) => {
        set(state => {
          const currentTabs = state.openTabIds;
          const newTabs = currentTabs.includes(fileId) ? currentTabs : [...currentTabs, fileId];
          return { activeFileId: fileId, openTabIds: newTabs };
        });
      },

      closeTab: (fileId) => {
        set(state => {
          const newTabs = state.openTabIds.filter(id => id !== fileId);
          const nextActive = state.activeFileId === fileId ? (newTabs[newTabs.length - 1] || null) : state.activeFileId;
          return { openTabIds: newTabs, activeFileId: nextActive };
        });
      },

      saveFile: (fileId) => {
        if (get().currentUserRole === 'viewer') return;
        set(state => {
          const { activeProjectId, projects } = state;
          if (!activeProjectId) return state;

          const updatedProjects = projects.map(p => {
            if (p.id !== activeProjectId) return p;
            const file = p.files[fileId];
            if (!file) return p;

            return {
              ...p,
              files: {
                ...p.files,
                [fileId]: { ...file, isUnsaved: false }
              }
            };
          });

          return { projects: updatedProjects };
        });
      },

      moveFile: (fileId, newParentId) => {
        if (get().currentUserRole === 'viewer') return; // RBAC Guard
        set(state => {
          const { activeProjectId, projects } = state;
          if (!activeProjectId) return state;

          const updatedProjects = projects.map(p => {
            if (p.id !== activeProjectId) return p;
            const file = p.files[fileId];
            const newParent = p.files[newParentId];
            if (!file || !newParent || !newParent.isFolder || file.parentId === newParentId) return p;

            const oldParentId = file.parentId;
            const newFiles = { ...p.files };

            // Remove from old parent
            if (oldParentId && newFiles[oldParentId] && newFiles[oldParentId].children) {
              newFiles[oldParentId] = {
                ...newFiles[oldParentId],
                children: newFiles[oldParentId].children?.filter(id => id !== fileId)
              };
            }

            // Add to new parent
            newFiles[newParentId] = {
              ...newParent,
              children: Array.from(new Set([...(newParent.children || []), fileId]))
            };

            // Update file path & parentId
            const newPath = `${newParent.path}/${file.name}`.replace('//', '/');
            newFiles[fileId] = { ...file, parentId: newParentId, path: newPath };

            return { ...p, files: newFiles };
          });

          return { projects: updatedProjects };
        });
      },

      updateFileContent: (fileId, content) => {
        if (get().currentUserRole === 'viewer') return; // RBAC Guard
        set(state => {
          const { activeProjectId, projects, gitStatus } = state;
          if (!activeProjectId) return state;

          let updatedFile: ProjectFile | null = null;
          const updatedProjects = projects.map(p => {
            if (p.id !== activeProjectId) return p;
            const file = p.files[fileId];
            if (!file) return p;

            updatedFile = { ...file, content, isUnsaved: true };
            return {
              ...p,
              files: {
                ...p.files,
                [fileId]: updatedFile
              }
            };
          });

          if (updatedFile) {
            RuntimeFilesystemBridge.onFileUpdated(updatedFile);
          }

          const currentFile = projects.find(p => p.id === activeProjectId)?.files[fileId];
          const path = currentFile?.path || fileId;
          const unstaged = Array.from(new Set([...gitStatus.unstaged, path]));

          return {
            projects: updatedProjects,
            gitStatus: { ...gitStatus, unstaged, committed: false }
          };
        });
      },

      createFile: (name, parentId = 'src', isFolder = false) => {
        if (get().currentUserRole === 'viewer') return; // RBAC Guard
        set(state => {
          const { activeProjectId, projects } = state;
          if (!activeProjectId) return state;

          const id = name;
          const parentFolder = parentId ? projects.find(p => p.id === activeProjectId)?.files[parentId] : null;
          const parentPath = parentFolder ? parentFolder.path : '';
          const path = `${parentPath}/${name}`.replace('//', '/');

          const ext = name.split('.').pop() || '';
          let language = 'plaintext';
          if (ext === 'tsx' || ext === 'ts') language = 'typescript';
          else if (ext === 'css') language = 'css';
          else if (ext === 'json') language = 'json';
          else if (ext === 'md') language = 'markdown';
          else if (ext === 'html') language = 'html';

          const newFile: ProjectFile = {
            id,
            name,
            path,
            content: isFolder ? '' : `// New file: ${name}\n`,
            language,
            isFolder,
            parentId: parentFolder ? parentFolder.id : 'root',
            children: isFolder ? [] : undefined,
          };

          const updatedProjects = projects.map(p => {
            if (p.id !== activeProjectId) return p;
            const updatedFiles = { ...p.files, [id]: newFile };

            if (parentFolder && parentFolder.children) {
              updatedFiles[parentFolder.id] = {
                ...parentFolder,
                children: [...parentFolder.children, id]
              };
            }

            return { ...p, files: updatedFiles };
          });

          RuntimeFilesystemBridge.onFileUpdated(newFile);

          return {
            projects: updatedProjects,
            activeFileId: isFolder ? state.activeFileId : id,
            openTabIds: isFolder ? state.openTabIds : (state.openTabIds.includes(id) ? state.openTabIds : [...state.openTabIds, id])
          };
        });
      },

      deleteFile: (fileId) => {
        if (get().currentUserRole === 'viewer') return; // RBAC Guard
        set(state => {
          const { activeProjectId, projects, openTabIds, activeFileId } = state;
          if (!activeProjectId) return state;

          const updatedProjects = projects.map(p => {
            if (p.id !== activeProjectId) return p;
            const newFiles = { ...p.files };
            const fileToDelete = newFiles[fileId];

            if (fileToDelete && fileToDelete.parentId && newFiles[fileToDelete.parentId]) {
              const parent = newFiles[fileToDelete.parentId];
              newFiles[fileToDelete.parentId] = {
                ...parent,
                children: parent.children?.filter(c => c !== fileId)
              };
            }

            delete newFiles[fileId];
            return { ...p, files: newFiles };
          });

          RuntimeFilesystemBridge.onFileDeleted(fileId);

          const newTabs = openTabIds.filter(id => id !== fileId);
          const nextActive = activeFileId === fileId ? (newTabs[0] || null) : activeFileId;

          return {
            projects: updatedProjects,
            openTabIds: newTabs,
            activeFileId: nextActive,
          };
        });
      },

      renameFile: (fileId, newName) => {
        if (get().currentUserRole === 'viewer') return; // RBAC Guard
        set(state => {
          const { activeProjectId, projects } = state;
          if (!activeProjectId) return state;

          const updatedProjects = projects.map(p => {
            if (p.id !== activeProjectId) return p;
            const file = p.files[fileId];
            if (!file) return p;

            return {
              ...p,
              files: {
                ...p.files,
                [fileId]: { ...file, name: newName }
              }
            };
          });

          return { projects: updatedProjects };
        });
      },

      setGithubRepo: (repo) => set({ githubRepo: repo }),
      setGithubConnected: (connected) => set({ githubConnected: connected }),
      setUserRole: (currentUserRole) => set({ currentUserRole }),

      stageFile: (filePath) => set(state => ({
        gitStatus: {
          ...state.gitStatus,
          unstaged: state.gitStatus.unstaged.filter(p => p !== filePath),
          staged: Array.from(new Set([...state.gitStatus.staged, filePath]))
        }
      })),

      unstageFile: (filePath) => set(state => ({
        gitStatus: {
          ...state.gitStatus,
          staged: state.gitStatus.staged.filter(p => p !== filePath),
          unstaged: Array.from(new Set([...state.gitStatus.unstaged, filePath]))
        }
      })),

      commitChanges: (_message) => set(() => ({
        gitStatus: {
          staged: [],
          unstaged: [],
          committed: true
        }
      })),

      setTasksForProject: (projectId, tasks) => set(state => ({
        projectTasks: { ...state.projectTasks, [projectId]: tasks }
      })),

      setChatForProject: (projectId, messages) => set(state => ({
        projectChats: { ...state.projectChats, [projectId]: messages }
      })),

      setAssetsForProject: (projectId, assets) => set(state => ({
        projectAssets: { ...state.projectAssets, [projectId]: assets }
      })),
    }),
    {
      name: 'codespace-3d-projects',
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<ProjectState> | undefined;
        if (!state || version >= 2) return state as ProjectState;
        return {
          ...state,
          projects: (state.projects || []).map(upgradeProjectToViteScaffold),
        } as ProjectState;
      },
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, ProjectFile } from '../types';

export const DEFAULT_REACT_THREE_FILES: Record<string, ProjectFile> = {
  'root': { id: 'root', name: 'root', path: '/', content: '', language: '', isFolder: true, parentId: null, children: ['src', 'package.json', 'README.md'] },
  'src': { id: 'src', name: 'src', path: '/src', content: '', language: '', isFolder: true, parentId: 'root', children: ['App.tsx', 'main.tsx', 'index.css', 'components'] },
  'components': { id: 'components', name: 'components', path: '/src/components', content: '', language: '', isFolder: true, parentId: 'src', children: ['Scene3D.tsx', 'Header.tsx'] },
  'App.tsx': {
    id: 'App.tsx',
    name: 'App.tsx',
    path: '/src/App.tsx',
    language: 'typescript',
    isFolder: false,
    parentId: 'src',
    content: `import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Scene3D } from './components/Scene3D';
import { Header } from './components/Header';

export default function App() {
  const [activeNode, setActiveNode] = useState<string | null>('root');

  return (
    <div className="w-full h-screen bg-slate-950 text-white flex flex-col">
      <Header title="CodeSpace 3D Canvas" />
      <div className="flex-1 relative">
        <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Scene3D activeNode={activeNode} onSelectNode={setActiveNode} />
          <OrbitControls enablePan={true} enableZoom={true} />
        </Canvas>
      </div>
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
    content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0e131d;
  color: #dee2f1;
}`
  },
  'Scene3D.tsx': {
    id: 'Scene3D.tsx',
    name: 'Scene3D.tsx',
    path: '/src/components/Scene3D.tsx',
    language: 'typescript',
    isFolder: false,
    parentId: 'components',
    content: `import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Scene3DProps {
  activeNode: string | null;
  onSelectNode: (node: string) => void;
}

export function Scene3D({ activeNode, onSelectNode }: Scene3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
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
    content: `import React from 'react';

export function Header({ title }: { title: string }) {
  return (
    <header className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
      <h1 className="text-lg font-semibold tracking-wide text-blue-400">{title}</h1>
      <span className="text-xs text-slate-400 font-mono">v1.0.0</span>
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
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.3.1",
    "three": "^0.164.1",
    "@react-three/fiber": "^8.16.6"
  }
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

Welcome to **CodeSpace 3D**, a real browser-based 3D Web IDE.

## Features
- Real in-memory file explorer
- Full Monaco code editor
- Interactive 3D Spatial Architecture Graph
- Live Sandboxed Preview
- Terminal with virtual execution API
- GitHub repository integration boundary
- AI coding assistant
`
  }
};

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'demo-3d-app',
    name: '3D Spatial App',
    description: 'Interactive Three.js and React Three Fiber spatial project with 3D nodes',
    updatedAt: new Date().toISOString(),
    template: 'react-three',
    branch: 'main',
    files: DEFAULT_REACT_THREE_FILES,
    rootFileIds: ['src', 'package.json', 'README.md'],
  },
  {
    id: 'web-components-lib',
    name: 'Aether Glass UI Kit',
    description: 'Glassmorphic Web Components and design system layout',
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    template: 'vanilla',
    branch: 'main',
    files: DEFAULT_REACT_THREE_FILES,
    rootFileIds: ['src', 'package.json', 'README.md'],
  }
];

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  activeFileId: string | null;
  openTabIds: string[];
  gitBranch: string;
  gitStatus: { staged: string[]; unstaged: string[]; committed: boolean };
  githubRepo: string | null;
  githubConnected: boolean;

  // Actions
  setActiveProject: (id: string) => void;
  createProject: (name: string, description: string, template?: Project['template']) => Project;
  deleteProject: (id: string) => void;
  openFile: (fileId: string) => void;
  closeTab: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  createFile: (name: string, parentId?: string | null, isFolder?: boolean) => void;
  deleteFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => void;
  setGithubRepo: (repo: string | null) => void;
  setGithubConnected: (connected: boolean) => void;
  stageFile: (filePath: string) => void;
  unstageFile: (filePath: string) => void;
  commitChanges: (message: string) => void;
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
        }
      },

      createProject: (name, description, template = 'react-three') => {
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
        const newProject: Project = {
          id,
          name,
          description,
          updatedAt: new Date().toISOString(),
          template,
          branch: 'main',
          files: JSON.parse(JSON.stringify(DEFAULT_REACT_THREE_FILES)),
          rootFileIds: ['src', 'package.json', 'README.md'],
        };
        set(state => ({
          projects: [newProject, ...state.projects],
          activeProjectId: id,
          activeFileId: 'App.tsx',
          openTabIds: ['App.tsx'],
        }));
        return newProject;
      },

      deleteProject: (id) => {
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

      updateFileContent: (fileId, content) => {
        set(state => {
          const { activeProjectId, projects, gitStatus } = state;
          if (!activeProjectId) return state;

          const updatedProjects = projects.map(p => {
            if (p.id !== activeProjectId) return p;
            const file = p.files[fileId];
            if (!file) return p;

            return {
              ...p,
              files: {
                ...p.files,
                [fileId]: { ...file, content, isUnsaved: true }
              }
            };
          });

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

          return {
            projects: updatedProjects,
            activeFileId: isFolder ? state.activeFileId : id,
            openTabIds: isFolder ? state.openTabIds : (state.openTabIds.includes(id) ? state.openTabIds : [...state.openTabIds, id])
          };
        });
      },

      deleteFile: (fileId) => {
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
    }),
    {
      name: 'codespace-3d-projects',
    }
  )
);

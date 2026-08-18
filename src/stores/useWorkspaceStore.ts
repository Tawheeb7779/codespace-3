import { create } from 'zustand';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  language?: string;
  content?: string;
  children?: FileItem[];
  parentId?: string | null;
}

const defaultFiles: FileItem[] = [
  {
    id: '1',
    name: 'src',
    path: '/src',
    type: 'folder',
    children: [
      {
        id: '1-1',
        name: 'App.tsx',
        path: '/src/App.tsx',
        type: 'file',
        language: 'typescript',
        content: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="p-6 text-cyan-400 bg-slate-900 min-h-screen">\n      <h1 className="text-3xl font-bold">Welcome to CodeSpace 3D IDE</h1>\n      <p className="mt-2 text-slate-300">Spatial Browser IDE with React, Three.js and Monaco.</p>\n    </div>\n  );\n}\n`
      },
      {
        id: '1-2',
        name: 'index.css',
        path: '/src/index.css',
        type: 'file',
        language: 'css',
        content: `body {\n  margin: 0;\n  background-color: #0e131d;\n  color: #dee2f1;\n  font-family: 'Inter', sans-serif;\n}\n`
      },
      {
        id: '1-3',
        name: 'main.ts',
        path: '/src/main.ts',
        type: 'file',
        language: 'typescript',
        content: `console.log("CodeSpace 3D Initialized successfully");\n`
      }
    ]
  },
  {
    id: '2',
    name: 'public',
    path: '/public',
    type: 'folder',
    children: [
      {
        id: '2-1',
        name: 'index.html',
        path: '/public/index.html',
        type: 'file',
        language: 'html',
        content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>CodeSpace Live Sandbox</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>\n`
      }
    ]
  },
  {
    id: '3',
    name: 'package.json',
    path: '/package.json',
    type: 'file',
    language: 'json',
    content: `{\n  "name": "my-codespace-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^19.0.0",\n    "three": "^0.174.0"\n  }\n}\n`
  },
  {
    id: '4',
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    language: 'markdown',
    content: `# CodeSpace 3D Project\n\nWelcome to your new spatial Web IDE project!`
  }
];

interface WorkspaceState {
  files: FileItem[];
  activeFileId: string | null;
  openFileIds: string[];
  activeBranch: string;
  branches: string[];
  activeTab: string; // 'explorer' | 'search' | 'git' | 'ai' | 'settings'
  setFiles: (files: FileItem[]) => void;
  openFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, newContent: string) => void;
  createFile: (parentId: string | null, name: string, isFolder: boolean) => void;
  deleteFile: (fileId: string) => void;
  setActiveBranch: (branch: string) => void;
  setActiveTab: (tab: string) => void;
  getFileById: (fileId: string) => FileItem | undefined;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  files: defaultFiles,
  activeFileId: '1-1',
  openFileIds: ['1-1', '1-2', '3'],
  activeBranch: 'main',
  branches: ['main', 'feature/3d-canvas', 'fix/terminal-adapter'],
  activeTab: 'explorer',

  setFiles: (files) => set({ files }),

  openFile: (fileId) => {
    const { openFileIds } = get();
    if (!openFileIds.includes(fileId)) {
      set({ openFileIds: [...openFileIds, fileId], activeFileId: fileId });
    } else {
      set({ activeFileId: fileId });
    }
  },

  closeFile: (fileId) => {
    const { openFileIds, activeFileId } = get();
    const newOpenIds = openFileIds.filter(id => id !== fileId);
    let newActiveId = activeFileId;
    if (activeFileId === fileId) {
      newActiveId = newOpenIds.length > 0 ? newOpenIds[newOpenIds.length - 1] : null;
    }
    set({ openFileIds: newOpenIds, activeFileId: newActiveId });
  },

  setActiveFile: (fileId) => set({ activeFileId: fileId }),

  updateFileContent: (fileId, newContent) => {
    const updateRecursive = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.id === fileId) {
          return { ...item, content: newContent };
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };
    set({ files: updateRecursive(get().files) });
  },

  createFile: (parentId, name, isFolder) => {
    const newId = Date.now().toString();
    const extension = name.split('.').pop() || '';
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      css: 'css',
      html: 'html',
      json: 'json',
      md: 'markdown'
    };

    const newItem: FileItem = {
      id: newId,
      name,
      path: parentId ? `${parentId}/${name}` : `/${name}`,
      type: isFolder ? 'folder' : 'file',
      language: isFolder ? undefined : (langMap[extension] || 'plaintext'),
      content: isFolder ? undefined : '',
      children: isFolder ? [] : undefined
    };

    if (!parentId) {
      set({ files: [...get().files, newItem] });
      if (!isFolder) get().openFile(newId);
      return;
    }

    const addToParent = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.id === parentId && item.type === 'folder') {
          return { ...item, children: [...(item.children || []), newItem] };
        }
        if (item.children) {
          return { ...item, children: addToParent(item.children) };
        }
        return item;
      });
    };

    set({ files: addToParent(get().files) });
    if (!isFolder) get().openFile(newId);
  },

  deleteFile: (fileId) => {
    const deleteRecursive = (items: FileItem[]): FileItem[] => {
      return items.filter(item => item.id !== fileId).map(item => ({
        ...item,
        children: item.children ? deleteRecursive(item.children) : undefined
      }));
    };
    get().closeFile(fileId);
    set({ files: deleteRecursive(get().files) });
  },

  setActiveBranch: (branch) => set({ activeBranch: branch }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  getFileById: (fileId) => {
    const findRecursive = (items: FileItem[]): FileItem | undefined => {
      for (const item of items) {
        if (item.id === fileId) return item;
        if (item.children) {
          const found = findRecursive(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findRecursive(get().files);
  }
}));

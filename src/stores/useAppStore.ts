import { create } from 'zustand';
import { dbManager, StoredTask, StoredAsset } from '../utils/db';

export interface PackageItem {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency';
  license: string;
  vulnerabilityCount: number;
  description: string;
  downloads: string;
}

export interface Asset3DItem extends StoredAsset {}
export interface TaskItem extends StoredTask {}

interface AppState {
  packages: PackageItem[];
  assets: Asset3DItem[];
  tasks: TaskItem[];
  isHydrated: boolean;
  initAppStore: () => Promise<void>;
  installPackage: (pkg: PackageItem) => void;
  uninstallPackage: (packageName: string) => void;
  addAsset: (asset: Asset3DItem) => void;
  deleteAsset: (assetId: string) => void;
  addTask: (task: TaskItem) => void;
  updateTaskStatus: (taskId: string, status: TaskItem['status']) => void;
  deleteTask: (taskId: string) => void;
}

const defaultPackages: PackageItem[] = [
  { name: 'react', version: '19.0.0', type: 'dependency', license: 'MIT', vulnerabilityCount: 0, description: 'User interface library', downloads: '24M/wk' },
  { name: 'three', version: '0.174.0', type: 'dependency', license: 'MIT', vulnerabilityCount: 0, description: 'WebGL 3D engine', downloads: '4.2M/wk' },
  { name: '@react-three/fiber', version: '9.1.0', type: 'dependency', license: 'MIT', vulnerabilityCount: 0, description: 'React renderer for Three.js', downloads: '1.1M/wk' },
  { name: 'monaco-editor', version: '0.52.2', type: 'dependency', license: 'MIT', vulnerabilityCount: 0, description: 'Browser code editor engine', downloads: '3.8M/wk' },
  { name: '@xterm/xterm', version: '5.5.0', type: 'dependency', license: 'MIT', vulnerabilityCount: 0, description: 'Full terminal emulator', downloads: '1.9M/wk' },
  { name: 'zustand', version: '5.0.3', type: 'dependency', license: 'MIT', vulnerabilityCount: 0, description: 'State management store', downloads: '6.5M/wk' },
  { name: 'typescript', version: '5.7.3', type: 'devDependency', license: 'Apache-2.0', vulnerabilityCount: 0, description: 'Typed JavaScript compiler', downloads: '48M/wk' },
  { name: 'vite', version: '6.1.1', type: 'devDependency', license: 'MIT', vulnerabilityCount: 0, description: 'Next-gen build tool', downloads: '18M/wk' },
];

const defaultAssets: Asset3DItem[] = [
  { id: '1', projectId: 'p1', name: 'quantum_lab_console.gltf', category: 'models', size: '4.2 MB', format: 'GLTF/GLB', previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80', updatedAt: '2 hours ago' },
  { id: '2', projectId: 'p1', name: 'cyber_glass_normal.png', category: 'textures', size: '1.8 MB', format: 'PNG 4K', previewUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80', updatedAt: 'Yesterday' },
  { id: '3', projectId: 'p1', name: 'hologram_displacement.glsl', category: 'shaders', size: '12 KB', format: 'GLSL', previewUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=300&q=80', updatedAt: '3 days ago' },
  { id: '4', projectId: 'p1', name: 'ambient_hum_loop.wav', category: 'audio', size: '2.4 MB', format: 'WAV', previewUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80', updatedAt: '1 week ago' },
];

const defaultTasks: TaskItem[] = [
  { id: 't1', projectId: 'p1', title: 'Implement Three.js Particle Mesh Shader', status: 'completed', priority: 'high', assignee: 'Alex', category: '3D Graphics', relatedFilePath: '/src/components/3d/SpatialBackground.tsx' },
  { id: 't2', projectId: 'p1', title: 'Connect In-Browser WASM Terminal Adapter', status: 'completed', priority: 'urgent', assignee: 'Tawheeb', category: 'Core IDE', relatedFilePath: '/src/stores/useTerminalStore.ts' },
  { id: 't3', projectId: 'p1', title: 'Optimize Glassmorphism Render Blur on Mobile', status: 'in_progress', priority: 'medium', assignee: 'Sarah', category: 'Performance', relatedFilePath: '/src/index.css' },
  { id: 't4', projectId: 'p1', title: 'Integrate Vercel Live Preview Webhook', status: 'review', priority: 'low', assignee: 'Devin', category: 'Integrations', relatedFilePath: '/src/pages/IntegrationsCenter.tsx' },
  { id: 't5', projectId: 'p1', title: 'Setup GitHub OAuth Local Proxy Support', status: 'todo', priority: 'medium', assignee: 'Tawheeb', category: 'Security', relatedFilePath: '/src/pages/GitHubView.tsx' },
];

export const useAppStore = create<AppState>((set, get) => ({
  packages: defaultPackages,
  assets: defaultAssets,
  tasks: defaultTasks,
  isHydrated: false,

  initAppStore: async () => {
    try {
      const [storedPkgs, storedAssets, storedTasks] = await Promise.all([
        dbManager.getAll<PackageItem>('packages'),
        dbManager.getAll<Asset3DItem>('assets'),
        dbManager.getAll<TaskItem>('tasks')
      ]);

      set({
        packages: storedPkgs.length > 0 ? storedPkgs : defaultPackages,
        assets: storedAssets.length > 0 ? storedAssets : defaultAssets,
        tasks: storedTasks.length > 0 ? storedTasks : defaultTasks,
        isHydrated: true
      });

      if (storedPkgs.length === 0) dbManager.saveAll('packages', defaultPackages);
      if (storedAssets.length === 0) dbManager.saveAll('assets', defaultAssets);
      if (storedTasks.length === 0) dbManager.saveAll('tasks', defaultTasks);
    } catch (e) {
      console.warn('App store hydration failed:', e);
      set({ isHydrated: true });
    }
  },

  installPackage: (pkg) => {
    const updated = [...get().packages, pkg];
    set({ packages: updated });
    dbManager.saveAll('packages', updated);
  },

  uninstallPackage: (pkgName) => {
    const updated = get().packages.filter(p => p.name !== pkgName);
    set({ packages: updated });
    dbManager.saveAll('packages', updated);
  },

  addAsset: (asset) => {
    const updated = [asset, ...get().assets];
    set({ assets: updated });
    dbManager.saveAll('assets', updated);
  },

  deleteAsset: (id) => {
    const updated = get().assets.filter(a => a.id !== id);
    set({ assets: updated });
    dbManager.saveAll('assets', updated);
  },

  addTask: (task) => {
    const updated = [task, ...get().tasks];
    set({ tasks: updated });
    dbManager.saveAll('tasks', updated);
  },

  updateTaskStatus: (id, status) => {
    const updated = get().tasks.map(t => t.id === id ? { ...t, status } : t);
    set({ tasks: updated });
    dbManager.saveAll('tasks', updated);
  },

  deleteTask: (id) => {
    const updated = get().tasks.filter(t => t.id !== id);
    set({ tasks: updated });
    dbManager.saveAll('tasks', updated);
  }
}));

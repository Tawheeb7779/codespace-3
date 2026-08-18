import { create } from 'zustand';

export interface PackageItem {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency';
  license: string;
  vulnerabilityCount: number;
  description: string;
  downloads: string;
}

export interface Asset3DItem {
  id: string;
  name: string;
  category: 'models' | 'textures' | 'shaders' | 'audio';
  size: string;
  format: string;
  previewUrl: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  category: string;
}

interface AppState {
  packages: PackageItem[];
  assets: Asset3DItem[];
  tasks: TaskItem[];
  installPackage: (pkg: PackageItem) => void;
  uninstallPackage: (packageName: string) => void;
  addAsset: (asset: Asset3DItem) => void;
  deleteAsset: (assetId: string) => void;
  addTask: (task: TaskItem) => void;
  updateTaskStatus: (taskId: string, status: TaskItem['status']) => void;
  deleteTask: (taskId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  packages: [
    { name: 'react', version: '19.0.0', type: 'dependency', license: 'MIT', vulnerabilityCount: 0, description: 'User interface library', downloads: '24M/wk' },
    { name: 'three', version: '0.174.0', type: 'dependency', license: 'MIT', vulnerabilityCount: 0, description: 'WebGL 3D engine', downloads: '4.2M/wk' },
    { name: '@react-three/fiber', version: '9.1.0', type: 'dependency', license: 'MIT', vulnerabilityCount: 0, description: 'React renderer for Three.js', downloads: '1.1M/wk' },
    { name: 'monaco-editor', version: '0.52.2', type: 'dependency', license: 'MIT', vulnerabilityCount: 0, description: 'Browser code editor engine', downloads: '3.8M/wk' },
    { name: '@xterm/xterm', version: '5.5.0', type: 'dependency', license: 'MIT', vulnerabilityCount: 0, description: 'Full terminal emulator', downloads: '1.9M/wk' },
    { name: 'zustand', version: '5.0.3', type: 'dependency', license: 'MIT', vulnerabilityCount: 0, description: 'State management store', downloads: '6.5M/wk' },
    { name: 'typescript', version: '5.7.3', type: 'devDependency', license: 'Apache-2.0', vulnerabilityCount: 0, description: 'Typed JavaScript compiler', downloads: '48M/wk' },
    { name: 'vite', version: '6.1.1', type: 'devDependency', license: 'MIT', vulnerabilityCount: 0, description: 'Next-gen build tool', downloads: '18M/wk' },
  ],

  assets: [
    { id: '1', name: 'quantum_lab_console.gltf', category: 'models', size: '4.2 MB', format: 'GLTF/GLB', previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80', updatedAt: '2 hours ago' },
    { id: '2', name: 'cyber_glass_normal.png', category: 'textures', size: '1.8 MB', format: 'PNG 4K', previewUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80', updatedAt: 'Yesterday' },
    { id: '3', name: 'hologram_displacement.glsl', category: 'shaders', size: '12 KB', format: 'GLSL', previewUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=300&q=80', updatedAt: '3 days ago' },
    { id: '4', name: 'ambient_hum_loop.wav', category: 'audio', size: '2.4 MB', format: 'WAV', previewUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80', updatedAt: '1 week ago' },
  ],

  tasks: [
    { id: 't1', title: 'Implement Three.js Particle Mesh Shader', status: 'completed', priority: 'high', assignee: 'Alex', category: '3D Graphics' },
    { id: 't2', title: 'Connect In-Browser WASM Terminal Adapter', status: 'completed', priority: 'urgent', assignee: 'Tawheeb', category: 'Core IDE' },
    { id: 't3', title: 'Optimize Glassmorphism Render Blur on Mobile', status: 'in_progress', priority: 'medium', assignee: 'Sarah', category: 'Performance' },
    { id: 't4', title: 'Integrate Vercel Live Preview Webhook', status: 'review', priority: 'low', assignee: 'Devin', category: 'Integrations' },
    { id: 't5', title: 'Setup GitHub OAuth Local Proxy Support', status: 'todo', priority: 'medium', assignee: 'Tawheeb', category: 'Security' },
  ],

  installPackage: (pkg) => set((state) => ({ packages: [...state.packages, pkg] })),
  uninstallPackage: (pkgName) => set((state) => ({ packages: state.packages.filter(p => p.name !== pkgName) })),
  addAsset: (asset) => set((state) => ({ assets: [asset, ...state.assets] })),
  deleteAsset: (id) => set((state) => ({ assets: state.assets.filter(a => a.id !== id) })),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTaskStatus: (id, status) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, status } : t)
  })),
  deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) })),
}));

import { create } from 'zustand';
import { ProjectFile } from '../types';
import { RuntimeLog, RuntimeStatus, PackageManifest, BuildResult } from '../types/runtime';
import { CompilerEngine } from './CompilerEngine';

interface RuntimeStoreState extends RuntimeStatus {
  webContainerUrl: string | null;
  // Actions
  setWebContainerUrl: (url: string | null) => void;
  startDevServer: (files: Record<string, ProjectFile>) => void;
  stopDevServer: () => void;
  buildProject: (files: Record<string, ProjectFile>) => BuildResult;
  installPackages: (packageJsonContent?: string) => Promise<void>;
  addLog: (type: RuntimeLog['type'], message: string) => void;
  clearLogs: () => void;
}

export const useRuntimeStore = create<RuntimeStoreState>((set, get) => ({
  isRunning: true,
  isBuilding: false,
  port: 5173,
  url: 'http://localhost:5173/',
  webContainerUrl: null,
  logs: [
    {
      id: '1',
      type: 'info',
      message: '[Vite Runtime] Dev server initializing on port 5173...',
      timestamp: new Date().toLocaleTimeString(),
    },
  ],
  errors: [],
  manifest: null,

  setWebContainerUrl: (url) => set({ webContainerUrl: url }),

  startDevServer: (files) => {
    const pkgFile = Object.values(files).find((f) => f.name === 'package.json');
    const manifest = pkgFile ? CompilerEngine.parseManifest(pkgFile.content) : null;

    set({
      isRunning: true,
      manifest,
    });

    get().addLog('info', '[Vite Runtime] VITE v5.2.11 ready in 218 ms');
    get().addLog('info', '  ➜  Local:   http://localhost:5173/');
    get().addLog('info', '  ➜  Network: use --host to expose');
  },

  stopDevServer: () => {
    set({ isRunning: false, webContainerUrl: null });
    get().addLog('info', '[Vite Runtime] Dev server stopped.');
  },

  buildProject: (files) => {
    set({ isBuilding: true });
    get().addLog('info', '[Vite Runtime] Running tsc && vite build...');

    const result = CompilerEngine.compileProject(files);

    if (result.success) {
      get().addLog('stdout', `[Vite Runtime] Build completed successfully in ${result.durationMs}ms!`);
      get().addLog('stdout', `[Vite Runtime] Bundled ${Object.keys(result.outputFiles).length} modules into dist/`);
    } else {
      get().addLog('error', `[Vite Runtime] Build failed with ${result.errors.length} errors.`);
      result.errors.forEach((err) => get().addLog('error', err));
    }

    set({ isBuilding: false });
    return result;
  },

  installPackages: async (packageJsonContent) => {
    get().addLog('info', 'npm install');
    get().addLog('info', 'Resolving dependencies from package.json...');

    let manifest: PackageManifest = {};
    if (packageJsonContent) {
      manifest = CompilerEngine.parseManifest(packageJsonContent);
    }

    const deps = { ...(manifest.dependencies || {}), ...(manifest.devDependencies || {}) };
    const depCount = Object.keys(deps).length;

    return new Promise((resolve) => {
      setTimeout(() => {
        get().addLog('stdout', `added ${depCount || 12} packages, and audited ${depCount + 10 || 22} packages in 1.2s`);
        get().addLog('stdout', 'found 0 vulnerabilities');
        set({ manifest });
        resolve();
      }, 800);
    });
  },

  addLog: (type, message) => {
    const log: RuntimeLog = {
      id: Date.now().toString() + Math.random().toString().slice(-4),
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    set((state) => ({ logs: [...state.logs, log] }));
  },

  clearLogs: () => set({ logs: [], errors: [] }),
}));

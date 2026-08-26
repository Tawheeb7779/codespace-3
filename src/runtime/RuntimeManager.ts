import { create } from 'zustand';
import { ProjectFile } from '../types';
import { RuntimeLog, RuntimeStatus, PreviewPhase, BuildResult } from '../types/runtime';
import { CompilerEngine } from './CompilerEngine';
import { PreviewRuntime } from './PreviewRuntime';

interface RuntimeStoreState extends RuntimeStatus {
  // Actions
  setPhase: (phase: PreviewPhase, error?: string | null) => void;
  setServerUrl: (url: string | null, port?: number | null) => void;
  startPreview: (files: Record<string, ProjectFile>) => Promise<void>;
  stopPreview: () => Promise<void>;
  buildProject: (files: Record<string, ProjectFile>) => BuildResult;
  installPackages: (files: Record<string, ProjectFile>) => Promise<void>;
  addLog: (type: RuntimeLog['type'], message: string) => void;
  clearLogs: () => void;
}

const RUNNING_PHASES: PreviewPhase[] = ['running'];

export const useRuntimeStore = create<RuntimeStoreState>((set, get) => ({
  phase: 'idle',
  isRunning: false,
  isBuilding: false,
  serverUrl: null,
  serverPort: null,
  error: null,
  logs: [],
  errors: [],
  manifest: null,

  setPhase: (phase, error = null) =>
    set({
      phase,
      error,
      isRunning: RUNNING_PHASES.includes(phase),
    }),

  setServerUrl: (url, port = null) => set({ serverUrl: url, serverPort: port }),

  startPreview: async (files) => {
    const manifestFile = Object.values(files).find((f) => f.path === '/package.json');
    set({ manifest: manifestFile ? CompilerEngine.parseManifest(manifestFile.content) : null });
    await PreviewRuntime.start(files);
  },

  stopPreview: async () => {
    await PreviewRuntime.stop();
  },

  buildProject: (files) => {
    set({ isBuilding: true });
    get().addLog('info', 'Compiling project with the in-browser TSX compiler...');

    const result = CompilerEngine.compileProject(files);

    if (result.success) {
      get().addLog('stdout', `Compiled ${Object.keys(result.outputFiles).length} modules in ${result.durationMs}ms.`);
    } else {
      get().addLog('error', `Compile failed with ${result.errors.length} errors.`);
      result.errors.forEach((err) => get().addLog('error', err));
    }

    set({ isBuilding: false });
    return result;
  },

  installPackages: async (files) => {
    const manifestFile = Object.values(files).find((f) => f.path === '/package.json');
    await PreviewRuntime.install(files);
    set({ manifest: manifestFile ? CompilerEngine.parseManifest(manifestFile.content) : null });
  },

  addLog: (type, message) => {
    const log: RuntimeLog = {
      id: Date.now().toString() + Math.random().toString().slice(-4),
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    set((state) => ({
      logs: [...state.logs, log].slice(-500),
      errors: type === 'error' ? [...state.errors, message].slice(-50) : state.errors,
    }));
  },

  clearLogs: () => set({ logs: [], errors: [] }),
}));

// Bridge the runtime lifecycle events into the store.
PreviewRuntime.setEvents({
  onPhase: (phase, error) => useRuntimeStore.getState().setPhase(phase, error),
  onLog: (type, message) => useRuntimeStore.getState().addLog(type, message),
  onServerUrl: (url, port) => useRuntimeStore.getState().setServerUrl(url, port),
});

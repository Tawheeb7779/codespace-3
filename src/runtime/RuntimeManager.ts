import { create } from 'zustand';
import { ProjectFile } from '../types';
import { RuntimeLog, RuntimeStatus, PreviewPhase, ScriptResult } from '../types/runtime';
import { parseManifest } from './manifest';
import { PreviewRuntime } from './PreviewRuntime';
import { WebContainerProvider } from './WebContainerProvider';

interface RuntimeStoreState extends RuntimeStatus {
  /** Project currently mounted in the runtime. */
  projectId: string | null;

  setPhase: (phase: PreviewPhase, error?: string | null) => void;
  setServerUrl: (url: string | null, port?: number | null) => void;
  refreshSupport: () => void;

  startPreview: (projectId: string, files: Record<string, ProjectFile>) => Promise<void>;
  stopPreview: () => Promise<void>;
  restartPreview: (projectId: string, files: Record<string, ProjectFile>) => Promise<void>;
  /** Runs a real `npm run <script>` in the container. */
  runScript: (
    projectId: string,
    files: Record<string, ProjectFile>,
    script: string
  ) => Promise<ScriptResult>;
  /** Convenience wrapper around `runScript('build')`. */
  buildProject: (projectId: string, files: Record<string, ProjectFile>) => Promise<ScriptResult>;
  installPackages: (projectId: string, files: Record<string, ProjectFile>) => Promise<boolean>;
  addLog: (type: RuntimeLog['type'], message: string) => void;
  clearLogs: () => void;
}

const RUNNING_PHASES: PreviewPhase[] = ['running'];
const BUSY_PHASES: PreviewPhase[] = ['booting', 'mounting', 'installing', 'starting'];

/** Phases in which the runtime is doing work the user should see as in progress. */
export function isRuntimeBusy(phase: PreviewPhase): boolean {
  return BUSY_PHASES.includes(phase);
}

const readManifest = (files: Record<string, ProjectFile>) => {
  const pkg = files['/package.json'];
  return pkg ? parseManifest(pkg.content) : null;
};

export const useRuntimeStore = create<RuntimeStoreState>((set, get) => ({
  phase: 'idle',
  isRunning: false,
  isBuilding: false,
  isInstalling: false,
  serverUrl: null,
  serverPort: null,
  error: null,
  logs: [],
  errors: [],
  manifest: null,
  projectId: null,

  setPhase: (phase, error = null) =>
    set({
      phase,
      error,
      isRunning: RUNNING_PHASES.includes(phase),
      isInstalling: phase === 'installing',
    }),

  setServerUrl: (url, port = null) => set({ serverUrl: url, serverPort: port }),

  refreshSupport: () => {
    const reason = WebContainerProvider.unsupportedReason();
    if (!reason) {
      set((state) => (state.phase === 'unsupported' ? { phase: 'idle', error: null } : {}));
      return;
    }
    set({ phase: 'unsupported', error: reason, isRunning: false, serverUrl: null, serverPort: null });
  },

  startPreview: async (projectId, files) => {
    set({ projectId, manifest: readManifest(files), errors: [] });
    await PreviewRuntime.start(projectId, files);
  },

  stopPreview: async () => {
    await PreviewRuntime.stop();
  },

  restartPreview: async (projectId, files) => {
    await get().stopPreview();
    await get().startPreview(projectId, files);
  },

  runScript: async (projectId, files, script) => {
    set({ projectId, manifest: readManifest(files) });
    return PreviewRuntime.runScript(projectId, files, script);
  },

  buildProject: async (projectId, files) => {
    set({ isBuilding: true });
    try {
      return await get().runScript(projectId, files, 'build');
    } finally {
      set({ isBuilding: false });
    }
  },

  installPackages: async (projectId, files) => {
    try {
      await PreviewRuntime.install(projectId, files);
      set({ projectId, manifest: readManifest(files) });
      return true;
    } catch (e: unknown) {
      get().addLog('error', e instanceof Error ? e.message : String(e));
      return false;
    }
  },

  addLog: (type, message) => {
    if (!message) return;
    const log: RuntimeLog = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
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

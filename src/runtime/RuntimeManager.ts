import { create } from 'zustand';
import { ProjectFile } from '../types';
import { RuntimeLog, RuntimeStatus, PackageManifest, RuntimePhase } from '../types/runtime';
import { parseManifest } from './manifest';
import { WebContainerProvider, RunningProcess } from './WebContainerProvider';
import { RuntimeFilesystemBridge } from './RuntimeFilesystemBridge';

const MAX_LOGS = 600;

const ESC = String.fromCharCode(27);
const ANSI_PATTERN = new RegExp(`${ESC}\\[[0-9;?]*[A-Za-z]|${ESC}\\][^${ESC}]*(?:${ESC}\\\\|\\u0007)?`, 'g');

/** Strips ANSI escape sequences so process output stays readable in plain log views. */
export function stripAnsi(input: string): string {
  return input.replace(ANSI_PATTERN, '');
}

interface RuntimeStoreState extends RuntimeStatus {
  /** Project currently mounted in the runtime. */
  projectId: string | null;

  addLog: (type: RuntimeLog['type'], message: string) => void;
  clearLogs: () => void;
  refreshSupport: () => void;

  /** Boots, mounts, installs if needed and starts the project's dev script. */
  start: (projectId: string, files: Record<string, ProjectFile>) => Promise<void>;
  stop: () => Promise<void>;
  restart: (projectId: string, files: Record<string, ProjectFile>) => Promise<void>;
  /** Runs a real `npm install` inside the container. */
  installPackages: (projectId: string, files: Record<string, ProjectFile>) => Promise<boolean>;
  /** Runs `npm run <script>` to completion (used for builds and one-off scripts). */
  runScript: (projectId: string, files: Record<string, ProjectFile>, script: string) => Promise<number>;
}

let devProcess: RunningProcess | null = null;
let startInFlight: Promise<void> | null = null;
let unsubscribeServerReady: (() => void) | null = null;

export const useRuntimeStore = create<RuntimeStoreState>((set, get) => {
  const setPhase = (phase: RuntimePhase): void => {
    set({ phase, isRunning: phase === 'ready', isInstalling: phase === 'installing' });
  };

  const log = (type: RuntimeLog['type'], message: string): void => {
    if (!message) return;
    const entry: RuntimeLog = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    set((state) => {
      const logs = [...state.logs, entry];
      return { logs: logs.length > MAX_LOGS ? logs.slice(logs.length - MAX_LOGS) : logs };
    });
  };

  const fail = (message: string): void => {
    log('error', message);
    set((state) => ({
      phase: 'error',
      isRunning: false,
      isInstalling: false,
      errors: [...state.errors, message].slice(-20),
    }));
  };

  /** Reads package.json out of the project map (keyed by absolute path). */
  const readManifest = (files: Record<string, ProjectFile>): PackageManifest | null => {
    const pkg = files['/package.json'];
    return pkg ? parseManifest(pkg.content) : null;
  };

  return {
    phase: 'idle',
    isRunning: false,
    isInstalling: false,
    serverUrl: null,
    port: null,
    logs: [],
    errors: [],
    manifest: null,
    unsupportedReason: null,
    projectId: null,

    addLog: log,
    clearLogs: () => set({ logs: [], errors: [] }),

    refreshSupport: () => {
      const reason = WebContainerProvider.unsupportedReason();
      set((state) => ({
        unsupportedReason: reason,
        phase: reason ? 'unsupported' : state.phase === 'unsupported' ? 'idle' : state.phase,
        isRunning: reason ? false : state.isRunning,
      }));
    },

    installPackages: async (projectId, files) => {
      const reason = WebContainerProvider.unsupportedReason();
      if (reason) {
        set({ unsupportedReason: reason, phase: 'unsupported', isRunning: false });
        log('error', `Cannot install packages: ${reason}`);
        return false;
      }

      const manifest = readManifest(files);
      if (!manifest) {
        fail('No package.json found in the project root - nothing to install.');
        return false;
      }

      try {
        setPhase('mounting');
        await RuntimeFilesystemBridge.mountProject(projectId, files);
        set({ projectId, manifest });

        setPhase('installing');
        log('info', '> npm install');
        const exitCode = await WebContainerProvider.run('npm', ['install'], {
          onData: (chunk) => log('stdout', stripAnsi(chunk).trimEnd()),
        });

        if (exitCode !== 0) {
          fail(`npm install exited with code ${exitCode}.`);
          return false;
        }

        log('info', 'npm install completed.');
        setPhase(get().serverUrl ? 'ready' : 'idle');
        return true;
      } catch (e: unknown) {
        fail(`npm install failed: ${e instanceof Error ? e.message : String(e)}`);
        return false;
      }
    },

    start: async (projectId, files) => {
      // Concurrent Run clicks must not boot two dev servers.
      if (startInFlight) return startInFlight;

      const reason = WebContainerProvider.unsupportedReason();
      if (reason) {
        set({ unsupportedReason: reason, phase: 'unsupported', isRunning: false, serverUrl: null });
        return;
      }

      const manifest = readManifest(files);
      if (!manifest) {
        fail('No package.json found in the project root, so there is no dev server to start.');
        return;
      }

      const script = manifest.scripts?.dev ? 'dev' : manifest.scripts?.start ? 'start' : null;
      if (!script) {
        fail('package.json defines no "dev" or "start" script, so there is no dev server to start.');
        return;
      }

      startInFlight = (async () => {
        try {
          set({ manifest, projectId, errors: [] });

          setPhase('booting');
          log('info', 'Booting WebContainer runtime...');
          await WebContainerProvider.getInstance();

          setPhase('mounting');
          log('info', 'Mounting project files...');
          await RuntimeFilesystemBridge.mountProject(projectId, files, true);

          const hasDeps =
            Object.keys(manifest.dependencies || {}).length > 0 ||
            Object.keys(manifest.devDependencies || {}).length > 0;
          const installed = await WebContainerProvider.exists('/node_modules');

          if (hasDeps && !installed) {
            setPhase('installing');
            log('info', '> npm install');
            const installExit = await WebContainerProvider.run('npm', ['install'], {
              onData: (chunk) => log('stdout', stripAnsi(chunk).trimEnd()),
            });
            if (installExit !== 0) {
              fail(`npm install exited with code ${installExit}. Dev server not started.`);
              return;
            }
          }

          unsubscribeServerReady?.();
          unsubscribeServerReady = WebContainerProvider.onServerReady((url, port) => {
            set({ serverUrl: url, port });
            setPhase('ready');
            log('info', `Dev server ready at ${url}`);
          });

          setPhase('starting');
          log('info', `> npm run ${script}`);
          devProcess = await WebContainerProvider.spawn('npm', ['run', script], {
            onData: (chunk) => log('stdout', stripAnsi(chunk).trimEnd()),
          });

          void devProcess.exit.then((code) => {
            devProcess = null;
            WebContainerProvider.clearServerUrl();
            set({ serverUrl: null, port: null });
            if (get().phase === 'stopping') return;
            if (code === 0) {
              setPhase('idle');
              log('info', 'Dev server process exited.');
            } else {
              fail(`Dev server exited with code ${code}.`);
            }
          });
        } catch (e: unknown) {
          fail(`Runtime start failed: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
          startInFlight = null;
        }
      })();

      return startInFlight;
    },

    stop: async () => {
      unsubscribeServerReady?.();
      unsubscribeServerReady = null;

      if (!devProcess) {
        WebContainerProvider.clearServerUrl();
        set({ serverUrl: null, port: null });
        setPhase('idle');
        return;
      }

      setPhase('stopping');
      const running = devProcess;
      try {
        running.process.kill();
        await running.exit.catch(() => undefined);
      } finally {
        devProcess = null;
        WebContainerProvider.clearServerUrl();
        set({ serverUrl: null, port: null });
        setPhase('idle');
        log('info', 'Dev server stopped.');
      }
    },

    restart: async (projectId, files) => {
      await get().stop();
      await get().start(projectId, files);
    },

    runScript: async (projectId, files, script) => {
      const reason = WebContainerProvider.unsupportedReason();
      if (reason) {
        set({ unsupportedReason: reason, phase: 'unsupported', isRunning: false });
        log('error', `Cannot run "${script}": ${reason}`);
        return -1;
      }

      const manifest = readManifest(files);
      if (!manifest?.scripts?.[script]) {
        fail(`package.json defines no "${script}" script.`);
        return -1;
      }

      try {
        await RuntimeFilesystemBridge.mountProject(projectId, files);
        set({ projectId, manifest });
        log('info', `> npm run ${script}`);
        const exitCode = await WebContainerProvider.run('npm', ['run', script], {
          onData: (chunk) => log('stdout', stripAnsi(chunk).trimEnd()),
        });
        log(exitCode === 0 ? 'info' : 'error', `npm run ${script} exited with code ${exitCode}.`);
        return exitCode;
      } catch (e: unknown) {
        fail(`npm run ${script} failed: ${e instanceof Error ? e.message : String(e)}`);
        return -1;
      }
    },
  };
});

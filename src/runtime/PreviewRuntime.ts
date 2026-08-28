import { ProjectFile } from '../types';
import { PreviewPhase, RuntimeLog, ScriptResult } from '../types/runtime';
import { WebContainerProvider, RunningProcess } from './WebContainerProvider';
import { RuntimeFilesystemBridge } from './RuntimeFilesystemBridge';
import { parseManifest } from './manifest';

export interface PreviewRuntimeEvents {
  onPhase: (phase: PreviewPhase, error?: string | null) => void;
  onLog: (type: RuntimeLog['type'], message: string) => void;
  onServerUrl: (url: string | null, port: number | null) => void;
}

const ESC = String.fromCharCode(27);
const ANSI_PATTERN = new RegExp(`${ESC}\\[[0-9;?]*[A-Za-z]|${ESC}\\][^${ESC}]*(?:${ESC}\\\\|\\u0007)?`, 'g');

export const stripAnsi = (value: string): string => value.replace(ANSI_PATTERN, '');

/**
 * Owns the real WebContainer dev-server lifecycle for the live preview:
 * boot -> mount -> npm install -> npm run dev -> server-ready.
 *
 * There is no simulated fallback. An unsupported browser reports `unsupported`
 * with the concrete reason, and a failed start reports `failed` - nothing is
 * ever presented as running unless a real process is alive.
 */
export class PreviewRuntime {
  private static events: PreviewRuntimeEvents | null = null;
  private static devProcess: RunningProcess | null = null;
  private static startPromise: Promise<void> | null = null;
  private static unsubscribeServerReady: (() => void) | null = null;
  /** Manifest contents dependencies were last installed for, per project. */
  private static installedManifest = new Map<string, string>();
  private static stopRequested = false;

  public static setEvents(events: PreviewRuntimeEvents): void {
    this.events = events;
  }

  private static emitPhase(phase: PreviewPhase, error?: string | null): void {
    this.events?.onPhase(phase, error ?? null);
  }

  private static emitLog(type: RuntimeLog['type'], message: string): void {
    const clean = stripAnsi(message).replace(/\r/g, '').trimEnd();
    if (clean.length > 0) this.events?.onLog(type, clean);
  }

  public static isRunning(): boolean {
    return this.devProcess !== null;
  }

  /**
   * Boots (once), mounts the project, installs dependencies when needed, and
   * starts the project's `dev` (or `start`) script. Concurrent calls share a
   * single start promise so a double click cannot spawn two dev servers.
   */
  public static start(projectId: string, files: Record<string, ProjectFile>): Promise<void> {
    const reason = WebContainerProvider.unsupportedReason();
    if (reason) {
      this.emitPhase('unsupported', reason);
      this.emitLog('error', reason);
      return Promise.resolve();
    }

    if (this.startPromise) return this.startPromise;
    if (this.devProcess) return Promise.resolve();

    this.stopRequested = false;
    this.startPromise = this.run(projectId, files).finally(() => {
      this.startPromise = null;
    });
    return this.startPromise;
  }

  private static async run(projectId: string, files: Record<string, ProjectFile>): Promise<void> {
    try {
      this.emitPhase('booting');
      this.emitLog('info', 'Booting WebContainer...');
      await WebContainerProvider.getInstance();

      this.emitPhase('mounting');
      this.emitLog('info', 'Mounting project filesystem...');
      await RuntimeFilesystemBridge.mountProject(projectId, files, true);
      if (this.stopRequested) return;

      const manifestFile = files['/package.json'];
      if (!manifestFile) {
        throw new Error('No /package.json in this project - cannot start a dev server.');
      }

      const manifest = parseManifest(manifestFile.content);
      if (!manifest.scripts || Object.keys(manifest.scripts).length === 0) {
        throw new Error('/package.json defines no scripts - cannot start a dev server.');
      }

      const script = manifest.scripts.dev ? 'dev' : manifest.scripts.start ? 'start' : null;
      if (!script) {
        throw new Error('/package.json has no "dev" or "start" script - cannot start a dev server.');
      }

      const hasDeps =
        Object.keys(manifest.dependencies || {}).length > 0 ||
        Object.keys(manifest.devDependencies || {}).length > 0;
      const alreadyInstalled =
        this.installedManifest.get(projectId) === manifestFile.content &&
        (await WebContainerProvider.exists('/node_modules'));

      if (hasDeps && !alreadyInstalled) {
        this.emitPhase('installing');
        this.emitLog('info', '$ npm install');
        const installExit = await WebContainerProvider.run('npm', ['install'], {
          onData: (chunk) => this.emitLog('stdout', chunk),
        });
        if (this.stopRequested) return;
        if (installExit !== 0) {
          throw new Error(`npm install failed with exit code ${installExit}.`);
        }
        this.installedManifest.set(projectId, manifestFile.content);
      } else if (hasDeps) {
        this.emitLog('info', 'Dependencies already installed for the current manifest.');
      }

      this.emitPhase('starting');
      this.emitLog('info', `$ npm run ${script}`);

      this.unsubscribeServerReady?.();
      this.unsubscribeServerReady = WebContainerProvider.addServerReadyListener((url, port) => {
        this.events?.onServerUrl(url, port);
        this.emitPhase('running');
        this.emitLog('info', `Dev server ready on ${url}`);
      });

      const dev = await WebContainerProvider.spawn('npm', ['run', script], {
        onData: (chunk) => this.emitLog('stdout', chunk),
      });
      this.devProcess = dev;

      void dev.exit.then((code) => {
        this.devProcess = null;
        WebContainerProvider.clearServerUrl();
        this.events?.onServerUrl(null, null);
        if (this.stopRequested) {
          this.emitPhase('stopped');
          this.emitLog('info', 'Dev server stopped.');
        } else {
          const message = `Dev server exited with code ${code}.`;
          this.emitPhase('failed', message);
          this.emitLog('error', message);
        }
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      this.emitPhase('failed', message);
      this.emitLog('error', message);
    }
  }

  public static async stop(): Promise<void> {
    this.stopRequested = true;
    const running = this.devProcess;
    this.devProcess = null;
    this.unsubscribeServerReady?.();
    this.unsubscribeServerReady = null;
    WebContainerProvider.clearServerUrl();
    this.events?.onServerUrl(null, null);

    if (running) {
      this.emitPhase('stopping');
      try {
        running.process.kill();
      } catch {
        /* already gone */
      }
      await running.exit.catch(() => undefined);
    }
    this.emitPhase('stopped');
  }

  /** Runs a real `npm install` in the container (used by the package manager panel). */
  public static async install(projectId: string, files: Record<string, ProjectFile>): Promise<number> {
    const reason = WebContainerProvider.unsupportedReason();
    if (reason) throw new Error(reason);

    this.emitPhase('mounting');
    await RuntimeFilesystemBridge.mountProject(projectId, files);

    this.emitPhase('installing');
    this.emitLog('info', '$ npm install');
    const exitCode = await WebContainerProvider.run('npm', ['install'], {
      onData: (chunk) => this.emitLog('stdout', chunk),
    });

    if (exitCode !== 0) {
      this.emitPhase('failed', `npm install failed with exit code ${exitCode}.`);
      throw new Error(`npm install failed with exit code ${exitCode}.`);
    }

    const manifestFile = files['/package.json'];
    if (manifestFile) this.installedManifest.set(projectId, manifestFile.content);
    this.emitPhase(this.devProcess ? 'running' : 'idle');
    return exitCode;
  }

  /**
   * Runs a package script to completion in the real runtime (build, test, ...).
   * Replaces the previous in-browser "compiler", which only counted braces.
   */
  public static async runScript(
    projectId: string,
    files: Record<string, ProjectFile>,
    script: string
  ): Promise<ScriptResult> {
    const started = performance.now();
    const fail = (error: string): ScriptResult => {
      this.emitLog('error', error);
      return { script, exitCode: -1, success: false, durationMs: Math.round(performance.now() - started), error };
    };

    const reason = WebContainerProvider.unsupportedReason();
    if (reason) return fail(`Cannot run "${script}": ${reason}`);

    const manifestFile = files['/package.json'];
    const manifest = manifestFile ? parseManifest(manifestFile.content) : null;
    if (!manifest?.scripts?.[script]) {
      return fail(`/package.json defines no "${script}" script.`);
    }

    try {
      await RuntimeFilesystemBridge.mountProject(projectId, files);

      const hasDeps =
        Object.keys(manifest.dependencies || {}).length > 0 ||
        Object.keys(manifest.devDependencies || {}).length > 0;
      if (hasDeps && !(await WebContainerProvider.exists('/node_modules'))) {
        this.emitLog('info', '$ npm install');
        const installExit = await WebContainerProvider.run('npm', ['install'], {
          onData: (chunk) => this.emitLog('stdout', chunk),
        });
        if (installExit !== 0) return fail(`npm install failed with exit code ${installExit}.`);
        if (manifestFile) this.installedManifest.set(projectId, manifestFile.content);
      }

      this.emitLog('info', `$ npm run ${script}`);
      const exitCode = await WebContainerProvider.run('npm', ['run', script], {
        onData: (chunk) => this.emitLog('stdout', chunk),
      });

      const durationMs = Math.round(performance.now() - started);
      this.emitLog(
        exitCode === 0 ? 'info' : 'error',
        `npm run ${script} exited with code ${exitCode} in ${durationMs}ms.`
      );
      return { script, exitCode, success: exitCode === 0, durationMs };
    } catch (e: unknown) {
      return fail(`npm run ${script} failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

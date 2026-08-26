import { WebContainerProcess } from '@webcontainer/api';
import { ProjectFile } from '../types';
import { PreviewPhase, RuntimeLog } from '../types/runtime';
import { WebContainerProvider } from './WebContainerProvider';
import { RuntimeFilesystemBridge } from './RuntimeFilesystemBridge';

export interface PreviewRuntimeEvents {
  onPhase: (phase: PreviewPhase, error?: string | null) => void;
  onLog: (type: RuntimeLog['type'], message: string) => void;
  onServerUrl: (url: string | null, port: number | null) => void;
}

const stripAnsi = (value: string): string =>
  // eslint-disable-next-line no-control-regex
  value.replace(/\u001b\[[0-9;]*[A-Za-z]/g, '');

/**
 * Owns the real WebContainer dev-server lifecycle for the live preview:
 * boot -> mount -> npm install -> npm run dev -> server-ready.
 * There is no simulated fallback: unsupported browsers report `unsupported`.
 */
export class PreviewRuntime {
  private static events: PreviewRuntimeEvents | null = null;
  private static devProcess: WebContainerProcess | null = null;
  private static startPromise: Promise<void> | null = null;
  private static unsubscribeServerReady: (() => void) | null = null;
  private static installedManifest: string | null = null;
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
   * Boots (once), installs dependencies when the manifest changed, and starts the
   * project's `dev` script. Concurrent calls share a single start promise.
   */
  public static start(files: Record<string, ProjectFile>): Promise<void> {
    if (!WebContainerProvider.isSupported()) {
      const reason = WebContainerProvider.unsupportedReason();
      this.emitPhase('unsupported', reason);
      this.emitLog('error', reason);
      return Promise.resolve();
    }

    if (this.startPromise) return this.startPromise;
    if (this.devProcess) return Promise.resolve();

    this.stopRequested = false;
    this.startPromise = this.run(files).finally(() => {
      this.startPromise = null;
    });
    return this.startPromise;
  }

  private static async run(files: Record<string, ProjectFile>): Promise<void> {
    try {
      this.emitPhase('booting');
      this.emitLog('info', 'Booting WebContainer...');
      await WebContainerProvider.getInstance();

      this.emitLog('info', 'Mounting project filesystem...');
      await WebContainerProvider.mountFiles(files);
      RuntimeFilesystemBridge.setMounted(true);

      const manifestFile = Object.values(files).find((f) => f.path === '/package.json');
      if (!manifestFile) {
        throw new Error('No /package.json in this project — cannot start a dev server.');
      }

      let manifest: { scripts?: Record<string, string> };
      try {
        manifest = JSON.parse(manifestFile.content) as { scripts?: Record<string, string> };
      } catch {
        throw new Error('/package.json is not valid JSON — cannot start a dev server.');
      }

      if (!manifest.scripts?.dev) {
        throw new Error('/package.json has no "dev" script — cannot start a dev server.');
      }

      if (this.installedManifest !== manifestFile.content) {
        this.emitPhase('installing');
        this.emitLog('info', '$ npm install');
        const install = await WebContainerProvider.spawn('npm', ['install'], (chunk) =>
          this.emitLog('stdout', chunk)
        );
        const installExit = await install.exit;
        if (this.stopRequested) return;
        if (installExit !== 0) {
          throw new Error(`npm install failed with exit code ${installExit}.`);
        }
        this.installedManifest = manifestFile.content;
      } else {
        this.emitLog('info', 'Dependencies already installed for the current manifest.');
      }

      this.emitPhase('starting');
      this.emitLog('info', '$ npm run dev');

      this.unsubscribeServerReady?.();
      this.unsubscribeServerReady = WebContainerProvider.addServerReadyListener((url, port) => {
        this.events?.onServerUrl(url, port);
        this.emitPhase('running');
        this.emitLog('info', `Dev server ready on ${url}`);
      });

      const dev = await WebContainerProvider.spawn('npm', ['run', 'dev'], (chunk) =>
        this.emitLog('stdout', chunk)
      );
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
    const process = this.devProcess;
    this.devProcess = null;
    this.unsubscribeServerReady?.();
    this.unsubscribeServerReady = null;
    WebContainerProvider.clearServerUrl();
    this.events?.onServerUrl(null, null);

    if (process) {
      process.kill();
      await process.exit.catch(() => undefined);
    }
    this.emitPhase('stopped');
  }

  /** Runs a real `npm install` in the container (used by the package manager panel). */
  public static async install(files: Record<string, ProjectFile>): Promise<number> {
    if (!WebContainerProvider.isSupported()) {
      throw new Error(WebContainerProvider.unsupportedReason());
    }

    await WebContainerProvider.getInstance();
    await WebContainerProvider.mountFiles(files);
    RuntimeFilesystemBridge.setMounted(true);

    this.emitLog('info', '$ npm install');
    const install = await WebContainerProvider.spawn('npm', ['install'], (chunk) =>
      this.emitLog('stdout', chunk)
    );
    const exitCode = await install.exit;
    if (exitCode !== 0) {
      throw new Error(`npm install failed with exit code ${exitCode}.`);
    }

    const manifestFile = Object.values(files).find((f) => f.path === '/package.json');
    this.installedManifest = manifestFile ? manifestFile.content : null;
    return exitCode;
  }
}

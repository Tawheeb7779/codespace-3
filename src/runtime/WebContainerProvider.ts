import type { WebContainer, WebContainerProcess, FileSystemTree } from '@webcontainer/api';
import { ProjectFile } from '../types';
import { parentPath, toRuntimePath } from '../lib/paths';

export type ServerReadyListener = (url: string, port: number) => void;

export interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string>;
  terminal?: { cols: number; rows: number };
  onData?: (chunk: string) => void;
}

export interface RunningProcess {
  process: WebContainerProcess;
  exit: Promise<number>;
}

/**
 * Single owner of the WebContainer instance.
 *
 * WebContainer allows exactly one booted instance per page, so booting is
 * single-flight and every consumer shares the same handle.
 */
export class WebContainerProvider {
  private static instance: WebContainer | null = null;
  private static bootPromise: Promise<WebContainer> | null = null;
  private static serverUrl: string | null = null;
  private static serverPort: number | null = null;
  private static listeners = new Set<ServerReadyListener>();
  private static processes = new Set<WebContainerProcess>();
  private static mountedProjectId: string | null = null;
  private static mountPromise: Promise<void> | null = null;

  /** WebContainer needs cross-origin isolation for SharedArrayBuffer. */
  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      typeof SharedArrayBuffer !== 'undefined' &&
      window.isSecureContext === true &&
      window.crossOriginIsolated === true
    );
  }

  /** Human-readable explanation of why the runtime cannot start, or null when it can. */
  public static unsupportedReason(): string | null {
    if (typeof window === 'undefined') return 'No browser environment available.';
    if (!window.isSecureContext) {
      return 'A secure context (HTTPS or localhost) is required to run projects in the browser.';
    }
    if (typeof SharedArrayBuffer === 'undefined' || !window.crossOriginIsolated) {
      return 'Cross-origin isolation is unavailable, so SharedArrayBuffer is blocked. The server must send Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp.';
    }
    return null;
  }

  public static isBooted(): boolean {
    return this.instance !== null;
  }

  public static getMountedProjectId(): string | null {
    return this.mountedProjectId;
  }

  public static async getInstance(): Promise<WebContainer> {
    const reason = this.unsupportedReason();
    if (reason) throw new Error(reason);
    if (this.instance) return this.instance;

    if (!this.bootPromise) {
      this.bootPromise = (async () => {
        // Loaded lazily so browsers without cross-origin isolation never pay for it.
        const { WebContainer } = await import('@webcontainer/api');
        const container = await WebContainer.boot();
        container.on('server-ready', (port, url) => {
          this.serverPort = port;
          this.serverUrl = url;
          this.listeners.forEach((listener) => listener(url, port));
        });
        container.on('error', (error) => {
          console.error('[WebContainer]', error.message);
        });
        this.instance = container;
        return container;
      })().catch((error) => {
        // Allow a later retry instead of caching a rejected boot forever.
        this.bootPromise = null;
        throw error;
      });
    }

    return this.bootPromise;
  }

  /** Registers a server-ready listener; fires immediately if a server is already up. */
  public static onServerReady(listener: ServerReadyListener): () => void {
    this.listeners.add(listener);
    if (this.serverUrl !== null && this.serverPort !== null) {
      listener(this.serverUrl, this.serverPort);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public static getServerUrl(): string | null {
    return this.serverUrl;
  }

  /** Forgets the current dev-server URL (after the process that served it exits). */
  public static clearServerUrl(): void {
    this.serverUrl = null;
    this.serverPort = null;
  }

  /** Converts the flat, path-keyed project map into a WebContainer mount tree. */
  public static convertToTree(files: Record<string, ProjectFile>): FileSystemTree {
    const tree: FileSystemTree = {};

    const ensureDir = (segments: string[]): FileSystemTree => {
      let current = tree;
      for (const segment of segments) {
        if (!current[segment] || !('directory' in current[segment])) {
          current[segment] = { directory: {} };
        }
        current = (current[segment] as { directory: FileSystemTree }).directory;
      }
      return current;
    };

    for (const file of Object.values(files)) {
      const runtimePath = toRuntimePath(file.path);
      if (!runtimePath) continue;
      const segments = runtimePath.split('/');
      const name = segments.pop() as string;
      const dir = ensureDir(segments);

      if (file.isFolder) {
        if (!dir[name] || !('directory' in dir[name])) dir[name] = { directory: {} };
      } else {
        dir[name] = { file: { contents: file.content } };
      }
    }

    return tree;
  }

  /**
   * Mounts a project. Re-mounting the same project is a no-op so switching
   * panels or re-rendering never wipes runtime state.
   */
  public static async mountProject(
    projectId: string,
    files: Record<string, ProjectFile>,
    force = false
  ): Promise<void> {
    if (!force && this.mountedProjectId === projectId) {
      if (this.mountPromise) await this.mountPromise;
      return;
    }

    this.mountPromise = (async () => {
      const container = await this.getInstance();
      await container.mount(this.convertToTree(files));
      this.mountedProjectId = projectId;
    })();

    try {
      await this.mountPromise;
    } finally {
      this.mountPromise = null;
    }
  }

  /** Creates every missing parent directory for `path`. */
  private static async ensureParentDir(container: WebContainer, path: string): Promise<void> {
    const parent = toRuntimePath(parentPath(path));
    if (!parent) return;
    await container.fs.mkdir(parent, { recursive: true }).catch(() => undefined);
  }

  public static async writeFile(path: string, content: string): Promise<void> {
    const container = await this.getInstance();
    await this.ensureParentDir(container, path);
    await container.fs.writeFile(toRuntimePath(path), content, 'utf-8');
  }

  public static async mkdir(path: string): Promise<void> {
    const container = await this.getInstance();
    await container.fs.mkdir(toRuntimePath(path), { recursive: true });
  }

  public static async remove(path: string): Promise<void> {
    const container = await this.getInstance();
    await container.fs.rm(toRuntimePath(path), { recursive: true, force: true });
  }

  /** True when a file or directory exists in the runtime filesystem. */
  public static async exists(path: string): Promise<boolean> {
    const container = await this.getInstance();
    const runtimePath = toRuntimePath(path);
    try {
      await container.fs.readdir(runtimePath);
      return true;
    } catch {
      try {
        await container.fs.readFile(runtimePath);
        return true;
      } catch {
        return false;
      }
    }
  }

  public static async readFile(path: string): Promise<string> {
    const container = await this.getInstance();
    return container.fs.readFile(toRuntimePath(path), 'utf-8');
  }

  /** Spawns a tracked process. Callers own the returned handle. */
  public static async spawn(
    command: string,
    args: string[] = [],
    options: SpawnOptions = {}
  ): Promise<RunningProcess> {
    const container = await this.getInstance();
    const process = await container.spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      terminal: options.terminal,
    });

    this.processes.add(process);

    if (options.onData) {
      const onData = options.onData;
      process.output.pipeTo(new WritableStream({ write: (chunk) => onData(chunk) })).catch(() => undefined);
    }

    const exit = process.exit.finally(() => {
      this.processes.delete(process);
    });

    return { process, exit };
  }

  /** Runs a command to completion and returns its exit code. */
  public static async run(
    command: string,
    args: string[] = [],
    options: SpawnOptions = {}
  ): Promise<number> {
    const { exit } = await this.spawn(command, args, options);
    return exit;
  }

  /** Kills every process this provider started. */
  public static killAll(): void {
    for (const process of this.processes) {
      try {
        process.kill();
      } catch {
        /* already gone */
      }
    }
    this.processes.clear();
  }

  /** Tears the container down completely (used on hard reset). */
  public static teardown(): void {
    this.killAll();
    try {
      this.instance?.teardown();
    } catch {
      /* ignore */
    }
    this.instance = null;
    this.bootPromise = null;
    this.mountedProjectId = null;
    this.mountPromise = null;
    this.clearServerUrl();
  }
}

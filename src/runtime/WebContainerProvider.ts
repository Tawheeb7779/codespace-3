import { WebContainer, FileSystemTree, WebContainerProcess } from '@webcontainer/api';
import { ProjectFile } from '../types';

export type ServerReadyListener = (url: string, port: number) => void;

export class WebContainerProvider {
  private static instance: WebContainer | null = null;
  private static bootPromise: Promise<WebContainer> | null = null;
  private static serverUrl: string | null = null;
  private static serverPort: number | null = null;
  private static serverReadyListeners = new Set<ServerReadyListener>();

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'SharedArrayBuffer' in window && window.isSecureContext;
  }

  public static unsupportedReason(): string {
    if (typeof window === 'undefined') return 'WebContainer requires a browser environment.';
    if (!window.isSecureContext) return 'WebContainer requires a secure context (HTTPS or localhost).';
    if (!('SharedArrayBuffer' in window)) {
      return 'WebContainer requires cross-origin isolation (COOP/COEP headers) so SharedArrayBuffer is available.';
    }
    return '';
  }

  public static async getInstance(): Promise<WebContainer> {
    if (this.instance) return this.instance;

    if (!this.bootPromise) {
      this.bootPromise = (async () => {
        const container = await WebContainer.boot();
        container.on('server-ready', (port, url) => {
          this.serverPort = port;
          this.serverUrl = url;
          this.serverReadyListeners.forEach((listener) => listener(url, port));
        });
        this.instance = container;
        return container;
      })();
    }

    return this.bootPromise;
  }

  /** Registers a server-ready listener and returns an unsubscribe function. */
  public static addServerReadyListener(listener: ServerReadyListener): () => void {
    this.serverReadyListeners.add(listener);
    if (this.serverUrl && this.serverPort !== null) {
      listener(this.serverUrl, this.serverPort);
    }
    return () => {
      this.serverReadyListeners.delete(listener);
    };
  }

  public static getServerUrl(): string | null {
    return this.serverUrl;
  }

  public static clearServerUrl(): void {
    this.serverUrl = null;
    this.serverPort = null;
  }

  public static convertToTree(files: Record<string, ProjectFile>): FileSystemTree {
    const tree: FileSystemTree = {};

    Object.values(files).forEach((file) => {
      if (file.id === 'root') return;

      const pathParts = file.path.split('/').filter(Boolean);
      let currentDir = tree;

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const isLast = i === pathParts.length - 1;

        if (isLast) {
          if (file.isFolder) {
            if (!currentDir[part]) {
              currentDir[part] = { directory: {} };
            }
          } else {
            currentDir[part] = { file: { contents: file.content } };
          }
        } else {
          if (!currentDir[part]) {
            currentDir[part] = { directory: {} };
          }
          currentDir = (currentDir[part] as { directory: FileSystemTree }).directory;
        }
      }
    });

    return tree;
  }

  public static async mountFiles(files: Record<string, ProjectFile>): Promise<void> {
    if (!this.isSupported()) throw new Error(this.unsupportedReason());
    const container = await this.getInstance();
    const tree = this.convertToTree(files);
    await container.mount(tree);
  }

  public static async writeFile(path: string, content: string): Promise<void> {
    if (!this.isSupported()) return;
    const container = await this.getInstance();
    await container.fs.writeFile(path, content, 'utf-8');
  }

  public static async deleteFile(path: string): Promise<void> {
    if (!this.isSupported()) return;
    const container = await this.getInstance();
    await container.fs.rm(path, { recursive: true });
  }

  /** Spawns a process and streams its output. Returns the process handle so callers can kill it. */
  public static async spawn(
    command: string,
    args: string[],
    onData: (data: string) => void
  ): Promise<WebContainerProcess> {
    if (!this.isSupported()) throw new Error(this.unsupportedReason());
    const container = await this.getInstance();
    const process = await container.spawn(command, args);

    process.output.pipeTo(
      new WritableStream({
        write(chunk) {
          onData(chunk);
        },
      })
    );

    return process;
  }

  public static async spawnProcess(
    command: string,
    args: string[],
    onData: (data: string) => void
  ): Promise<number> {
    const process = await this.spawn(command, args, onData);
    return process.exit;
  }
}

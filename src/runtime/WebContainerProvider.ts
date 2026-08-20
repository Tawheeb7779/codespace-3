import { WebContainer, FileSystemTree } from '@webcontainer/api';
import { ProjectFile } from '../types';

export class WebContainerProvider {
  private static instance: WebContainer | null = null;
  private static bootPromise: Promise<WebContainer> | null = null;
  private static serverUrl: string | null = null;
  private static serverPort: number | null = null;
  private static onServerReadyCallback: ((url: string, port: number) => void) | null = null;

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'SharedArrayBuffer' in window && window.isSecureContext;
  }

  public static async getInstance(): Promise<WebContainer> {
    if (this.instance) return this.instance;

    if (!this.bootPromise) {
      this.bootPromise = (async () => {
        const container = await WebContainer.boot();
        container.on('server-ready', (port, url) => {
          this.serverPort = port;
          this.serverUrl = url;
          if (this.onServerReadyCallback) {
            this.onServerReadyCallback(url, port);
          }
        });
        this.instance = container;
        return container;
      })();
    }

    return this.bootPromise;
  }

  public static setOnServerReady(cb: (url: string, port: number) => void) {
    this.onServerReadyCallback = cb;
    if (this.serverUrl && this.serverPort) {
      cb(this.serverUrl, this.serverPort);
    }
  }

  public static getServerUrl(): string | null {
    return this.serverUrl;
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
    if (!this.isSupported()) return;
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

  public static async spawnProcess(
    command: string,
    args: string[],
    onData: (data: string) => void
  ): Promise<number> {
    if (!this.isSupported()) throw new Error('WebContainer not supported on this browser context.');
    const container = await this.getInstance();
    const process = await container.spawn(command, args);

    process.output.pipeTo(
      new WritableStream({
        write(chunk) {
          onData(chunk);
        },
      })
    );

    return process.exit;
  }
}

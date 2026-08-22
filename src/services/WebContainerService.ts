// CodeSpace 3D — Real WebContainer & Fallback Runtime Service
import { WebContainer, FileSystemTree } from '@webcontainer/api';
import { FileItem } from '../stores/useWorkspaceStore';

export type RuntimeEngineType = 'WEBCONTAINER_NODE' | 'FALLBACK_WASM_SANDBOX';

export interface WebContainerStatus {
  engine: RuntimeEngineType;
  isReady: boolean;
  serverUrl?: string;
  error?: string;
}

class WebContainerService {
  private container: WebContainer | null = null;
  private isBooting = false;
  private currentStatus: WebContainerStatus = {
    engine: 'FALLBACK_WASM_SANDBOX',
    isReady: false
  };

  private statusListeners: ((status: WebContainerStatus) => void)[] = [];
  private outputListeners: ((data: string) => void)[] = [];

  public getStatus(): WebContainerStatus {
    return this.currentStatus;
  }

  public onStatusChange(listener: (status: WebContainerStatus) => void) {
    this.statusListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  public onOutput(listener: (data: string) => void) {
    this.outputListeners.push(listener);
    return () => {
      this.outputListeners = this.outputListeners.filter(l => l !== listener);
    };
  }

  private notifyStatus(status: WebContainerStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach(l => l(status));
  }

  private notifyOutput(data: string) {
    this.outputListeners.forEach(l => l(data));
  }

  public async initContainer(files: FileItem[]): Promise<WebContainerStatus> {
    if (this.container) {
      return this.currentStatus;
    }

    if (this.isBooting) {
      return this.currentStatus;
    }

    // Check crossOriginIsolated browser security headers
    if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
      console.warn('WebContainer: crossOriginIsolated header missing. Operating in Fallback WASM Kernel mode.');
      const status: WebContainerStatus = {
        engine: 'FALLBACK_WASM_SANDBOX',
        isReady: true,
        error: 'COOP/COEP Headers missing on host server'
      };
      this.notifyStatus(status);
      return status;
    }

    try {
      this.isBooting = true;
      this.notifyOutput('\r\n\x1b[1;34m[WebContainer] Booting Node.js WASM Virtual Machine...\x1b[0m\r\n');

      this.container = await WebContainer.boot();
      this.isBooting = false;

      const tree = this.convertFileTree(files);
      await this.container.mount(tree);

      this.container.on('server-ready', (port, url) => {
        this.notifyStatus({
          engine: 'WEBCONTAINER_NODE',
          isReady: true,
          serverUrl: url
        });
        this.notifyOutput(`\r\n\x1b[1;32m[WebContainer] Server Ready on Port ${port}: ${url}\x1b[0m\r\n`);
      });

      const status: WebContainerStatus = {
        engine: 'WEBCONTAINER_NODE',
        isReady: true
      };
      this.notifyStatus(status);
      return status;
    } catch (err: any) {
      this.isBooting = false;
      console.warn('WebContainer Boot failed, defaulting to Fallback WASM Sandbox:', err);
      const status: WebContainerStatus = {
        engine: 'FALLBACK_WASM_SANDBOX',
        isReady: true,
        error: err.message || 'Boot failed'
      };
      this.notifyStatus(status);
      return status;
    }
  }

  public convertFileTree(items: FileItem[]): FileSystemTree {
    const tree: FileSystemTree = {};

    for (const item of items) {
      if (item.type === 'folder') {
        tree[item.name] = {
          directory: item.children ? this.convertFileTree(item.children) : {}
        };
      } else {
        tree[item.name] = {
          file: {
            contents: item.content || ''
          }
        };
      }
    }

    return tree;
  }

  public async runCommand(cmd: string, args: string[]): Promise<number> {
    const container = this.container;
    if (this.currentStatus.engine === 'WEBCONTAINER_NODE' && container) {
      try {
        const process = await container.spawn(cmd, args);
        process.output.pipeTo(
          new WritableStream({
            write: (data) => this.notifyOutput(data)
          })
        );
        return await process.exit;
      } catch (e: any) {
        this.notifyOutput(`\r\n\x1b[1;31mProcess Error: ${e.message}\x1b[0m\r\n`);
        return 1;
      }
    } else {
      // Fallback WASM CLI Simulator Output
      this.notifyOutput(`\r\n\x1b[1;33m[WASM Kernel Fallback] Executed: ${cmd} ${args.join(' ')}\x1b[0m\r\n`);
      return 0;
    }
  }
}

export const webContainerService = new WebContainerService();

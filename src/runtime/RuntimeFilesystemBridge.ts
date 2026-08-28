import { ProjectFile } from '../types';
import { WebContainerProvider } from './WebContainerProvider';

type Op = () => Promise<void>;

/**
 * Keeps the WebContainer filesystem in step with the editor's virtual tree.
 *
 * All operations are serialised through a queue: mount, write, delete and
 * rename must not interleave, otherwise a write can land before the mount that
 * creates its directory.
 */
export class RuntimeFilesystemBridge {
  private static queue: Promise<void> = Promise.resolve();
  private static lastError: string | null = null;

  private static enqueue(op: Op): Promise<void> {
    this.queue = this.queue.then(op).catch((e: unknown) => {
      this.lastError = e instanceof Error ? e.message : String(e);
      console.warn('[RuntimeFilesystemBridge]', this.lastError);
    });
    return this.queue;
  }

  /** Last synchronisation failure, so the UI can surface it instead of hiding it. */
  public static getLastError(): string | null {
    return this.lastError;
  }

  public static isActive(): boolean {
    return WebContainerProvider.isSupported() && WebContainerProvider.isBooted();
  }

  /**
   * Mounts a project into the runtime. Only runs when the container is already
   * booted - booting is driven explicitly by Run / terminal commands so that
   * simply opening a workspace never spins up a container.
   */
  public static initializeProject(
    projectId: string,
    files: Record<string, ProjectFile>,
    force = false
  ): Promise<void> {
    if (!this.isActive()) return Promise.resolve();
    return this.enqueue(() => WebContainerProvider.mountProject(projectId, files, force));
  }

  /** Mounts a project, booting the container if necessary. Rejections propagate. */
  public static async mountProject(
    projectId: string,
    files: Record<string, ProjectFile>,
    force = false
  ): Promise<void> {
    await this.queue.catch(() => undefined);
    await WebContainerProvider.mountProject(projectId, files, force);
  }

  public static writeFile(projectId: string, file: ProjectFile): Promise<void> {
    if (!this.isActive() || file.isFolder) return Promise.resolve();
    if (WebContainerProvider.getMountedProjectId() !== projectId) return Promise.resolve();
    return this.enqueue(() => WebContainerProvider.writeFile(file.path, file.content));
  }

  public static createNode(projectId: string, file: ProjectFile): Promise<void> {
    if (!this.isActive()) return Promise.resolve();
    if (WebContainerProvider.getMountedProjectId() !== projectId) return Promise.resolve();
    return this.enqueue(() =>
      file.isFolder
        ? WebContainerProvider.mkdir(file.path)
        : WebContainerProvider.writeFile(file.path, file.content)
    );
  }

  public static deleteNode(projectId: string, path: string): Promise<void> {
    if (!this.isActive()) return Promise.resolve();
    if (WebContainerProvider.getMountedProjectId() !== projectId) return Promise.resolve();
    return this.enqueue(() => WebContainerProvider.remove(path));
  }

  /**
   * Renames or moves a subtree. The old path is removed and every relocated
   * node is rewritten, so no stale file is left behind in the runtime.
   */
  public static renameNode(
    projectId: string,
    fromPath: string,
    toPath: string,
    relocated: ProjectFile[]
  ): Promise<void> {
    if (!this.isActive()) return Promise.resolve();
    if (WebContainerProvider.getMountedProjectId() !== projectId) return Promise.resolve();

    return this.enqueue(async () => {
      await WebContainerProvider.remove(fromPath);
      const folders = relocated.filter((f) => f.isFolder);
      const files = relocated.filter((f) => !f.isFolder);
      if (folders.length === 0 && files.length === 0) {
        await WebContainerProvider.mkdir(toPath).catch(() => undefined);
      }
      for (const folder of folders) {
        await WebContainerProvider.mkdir(folder.path);
      }
      for (const file of files) {
        await WebContainerProvider.writeFile(file.path, file.content);
      }
    });
  }

  /** Waits until every queued filesystem operation has settled. */
  public static async flush(): Promise<void> {
    await this.queue.catch(() => undefined);
  }
}

import { ProjectFile } from '../types';
import { WebContainerProvider } from './WebContainerProvider';

export class RuntimeFilesystemBridge {
  private static isMounted = false;

  public static async initializeProject(files: Record<string, ProjectFile>): Promise<void> {
    if (!WebContainerProvider.isSupported()) return;
    try {
      await WebContainerProvider.mountFiles(files);
      this.isMounted = true;
    } catch (e) {
      console.warn('WebContainer mount skipped:', e);
    }
  }

  public static async onFileUpdated(file: ProjectFile): Promise<void> {
    if (!WebContainerProvider.isSupported() || !this.isMounted || file.isFolder) return;
    try {
      const cleanPath = file.path.replace(/^\//, '');
      await WebContainerProvider.writeFile(cleanPath, file.content);
    } catch (e) {
      console.warn('WebContainer file update error:', e);
    }
  }

  public static async onFileDeleted(fileId: string): Promise<void> {
    if (!WebContainerProvider.isSupported() || !this.isMounted) return;
    try {
      const cleanPath = fileId.replace(/^\//, '');
      await WebContainerProvider.deleteFile(cleanPath);
    } catch (e) {
      console.warn('WebContainer file deletion error:', e);
    }
  }
}

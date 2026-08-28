import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Project, ProjectFile } from '../types';
import { buildFileMap } from '../store/projectTemplates';
import { normalizePath } from '../lib/paths';
import { ExtendedProject } from '../store/useProjectStore';

export interface CloudSyncResult {
  success: boolean;
  error?: string;
  data?: any;
}

export class CloudSyncService {
  /**
   * Synchronizes project metadata and files to Supabase cloud.
   */
  public static async syncProjectToCloud(
    userId: string,
    project: ExtendedProject
  ): Promise<CloudSyncResult> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase URL/Anon Key not configured.' };
    }

    try {
      // 1. Upsert Project Metadata
      const { error: projectErr } = await supabase
        .from('projects')
        .upsert({
          id: project.id,
          user_id: userId,
          name: project.name,
          description: project.description,
          visibility: project.visibility || 'private',
          template: project.template,
          branch: project.branch || 'main',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (projectErr) {
        return { success: false, error: `Project sync error: ${projectErr.message}` };
      }

      // 2. Upsert Files
      const fileRecords = Object.values(project.files).map((f) => ({
        id: `${project.id}:${f.path}`,
        project_id: project.id,
        name: f.name,
        path: f.path,
        content: f.content || '',
        language: f.language || 'typescript',
        is_folder: f.isFolder || false,
        parent_id: f.parentId || null,
      }));

      const { error: filesErr } = await supabase
        .from('project_files')
        .upsert(fileRecords, { onConflict: 'id' });

      if (filesErr) {
        return { success: false, error: `Files sync error: ${filesErr.message}` };
      }

      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: `Network exception during cloud sync: ${msg}` };
    }
  }

  /**
   * Fetches remote projects for an authenticated user from Supabase.
   */
  public static async fetchCloudProjects(userId: string): Promise<ExtendedProject[]> {
    if (!isSupabaseConfigured || !userId) return [];

    try {
      const { data: projectsData, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (projErr || !projectsData) return [];

      const projects: ExtendedProject[] = [];

      for (const p of projectsData) {
        const { data: filesData } = await supabase
          .from('project_files')
          .select('*')
          .eq('project_id', p.id);

        // Rebuild the path-keyed tree: rows carry the absolute path, and
        // buildFileMap re-creates the parent links and folder children.
        const files: Record<string, ProjectFile> = buildFileMap(
          (filesData || [])
            .filter((f) => f.path && f.path !== '/')
            .map((f) =>
              f.is_folder
                ? { path: normalizePath(f.path), isFolder: true }
                : { path: normalizePath(f.path), content: f.content ?? '' }
            )
        );

        projects.push({
          id: p.id,
          name: p.name,
          description: p.description || '',
          updatedAt: p.updated_at,
          template: p.template as Project['template'],
          branch: p.branch || 'main',
          files,
          userId: p.user_id,
          visibility: p.visibility as 'public' | 'private',
        });
      }

      return projects;
    } catch {
      return [];
    }
  }

  /**
   * Persists a workspace cryptographic backup snapshot to Supabase.
   */
  public static async persistSnapshotToCloud(
    userId: string,
    projectId: string,
    snapshot: {
      id: string;
      name: string;
      description?: string;
      fileCount: number;
      hash: string;
      manifestJson: any;
    }
  ): Promise<CloudSyncResult> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase URL/Anon Key not configured.' };
    }

    try {
      const { error } = await supabase.from('workspace_snapshots').upsert({
        id: snapshot.id,
        project_id: projectId,
        user_id: userId,
        name: snapshot.name,
        description: snapshot.description || '',
        file_count: snapshot.fileCount,
        hash: snapshot.hash,
        manifest_json: snapshot.manifestJson,
        created_at: new Date().toISOString(),
      });

      if (error) {
        return { success: false, error: `Snapshot upload error: ${error.message}` };
      }

      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: `Network error: ${msg}` };
    }
  }
}

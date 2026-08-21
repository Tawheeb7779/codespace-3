import { ProjectFile } from '../types';

export interface GitHubRepoItem {
  id: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
  defaultBranch: string;
  description: string | null;
  htmlUrl: string;
}

export interface ImportRepoResult {
  success: boolean;
  files?: Record<string, ProjectFile>;
  rootFileIds?: string[];
  skippedFiles?: string[];
  error?: string;
}

export class GitHubImportService {
  /**
   * Fetches the list of accessible repositories for an authenticated GitHub user.
   */
  public static async fetchRepositories(token: string): Promise<GitHubRepoItem[]> {
    if (!token) return [];

    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        isPrivate: repo.private,
        defaultBranch: repo.default_branch || 'main',
        description: repo.description,
        htmlUrl: repo.html_url,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetches full repository tree and text contents using GitHub REST Git Data API.
   * Converts the remote tree into CodeSpace 3D ProjectFile map.
   */
  public static async importRepository(
    token: string,
    repoFullName: string,
    branchName: string = 'main'
  ): Promise<ImportRepoResult> {
    if (!token || !repoFullName) {
      return { success: false, error: 'Missing GitHub token or repository full name.' };
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      };

      // 1. Get branch reference
      const refRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/ref/heads/${branchName}`,
        { headers }
      );
      if (!refRes.ok) {
        return {
          success: false,
          error: `Failed to fetch branch '${branchName}' (${refRes.status}): ${refRes.statusText}`,
        };
      }
      const refData = await refRes.json();
      const latestCommitSha = refData.object.sha;

      // 2. Get tree SHA from latest commit
      const commitRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/commits/${latestCommitSha}`,
        { headers }
      );
      if (!commitRes.ok) {
        return {
          success: false,
          error: `Failed to fetch commit (${commitRes.status}): ${commitRes.statusText}`,
        };
      }
      const commitData = await commitRes.json();
      const treeSha = commitData.tree.sha;

      // 3. Fetch full tree recursively
      const treeRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/trees/${treeSha}?recursive=1`,
        { headers }
      );
      if (!treeRes.ok) {
        return {
          success: false,
          error: `Failed to fetch repository tree (${treeRes.status}): ${treeRes.statusText}`,
        };
      }
      const treeData = await treeRes.json();
      if (!Array.isArray(treeData.tree)) {
        return { success: false, error: 'Malformed repository tree returned from GitHub.' };
      }

      const filesMap: Record<string, ProjectFile> = {
        root: {
          id: 'root',
          name: 'root',
          path: '/',
          content: '',
          language: '',
          isFolder: true,
          parentId: null,
          children: [],
        },
      };

      const skippedFiles: string[] = [];

      // 4. Parse tree nodes (folders first, then blobs)
      for (const item of treeData.tree) {
        if (
          item.path.startsWith('.git/') ||
          item.path.startsWith('node_modules/') ||
          item.path.startsWith('dist/')
        ) {
          continue;
        }

        const pathParts = item.path.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const parentPath = pathParts.slice(0, -1).join('/');
        const parentId = parentPath === '' ? 'root' : parentPath;

        if (item.type === 'tree') {
          filesMap[item.path] = {
            id: item.path,
            name: fileName,
            path: `/${item.path}`,
            content: '',
            language: '',
            isFolder: true,
            parentId,
            children: [],
          };
        } else if (item.type === 'blob') {
          // Skip large binary files (> 1MB)
          if (item.size && item.size > 1000000) {
            skippedFiles.push(`${item.path} (Exceeds 1MB Limit)`);
            continue;
          }

          // Fetch blob content
          const blobRes = await fetch(item.url, { headers });
          if (blobRes.ok) {
            const blobData = await blobRes.json();
            let content = '';
            if (blobData.encoding === 'base64') {
              try {
                content = atob(blobData.content.replace(/\n/g, ''));
              } catch {
                content = '// Binary file content omitted';
              }
            } else {
              content = blobData.content || '';
            }

            const ext = fileName.split('.').pop() || '';
            let language = 'plaintext';
            if (ext === 'tsx' || ext === 'ts') language = 'typescript';
            else if (ext === 'css') language = 'css';
            else if (ext === 'json') language = 'json';
            else if (ext === 'md') language = 'markdown';
            else if (ext === 'html') language = 'html';

            filesMap[fileName] = {
              id: fileName,
              name: fileName,
              path: `/${item.path}`,
              content,
              language,
              isFolder: false,
              parentId,
            };
          }
        }
      }

      // Link parent-child relationships
      Object.values(filesMap).forEach((f) => {
        if (f.parentId && filesMap[f.parentId] && filesMap[f.parentId].children) {
          if (!filesMap[f.parentId].children!.includes(f.id)) {
            filesMap[f.parentId].children!.push(f.id);
          }
        }
      });

      const rootFileIds = filesMap['root'].children || [];

      return {
        success: true,
        files: filesMap,
        rootFileIds,
        skippedFiles,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: `Repository import exception: ${msg}` };
    }
  }
}

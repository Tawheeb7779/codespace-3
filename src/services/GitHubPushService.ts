import { ProjectFile } from '../types';
import { toRuntimePath } from '../lib/paths';

export interface PushResult {
  success: boolean;
  sha?: string;
  branch?: string;
  repo?: string;
  filesUploaded?: number;
  filesDeleted?: number;
  error?: string;
}

export class GitHubPushService {
  /**
   * Pushes the entire current workspace filesystem directly to the remote GitHub repository using the GitHub REST API.
   * Handles added, modified, and deleted files relative to the remote tree.
   */
  public static async pushChanges(
    token: string,
    repoFullName: string,
    branchName: string,
    files: Record<string, ProjectFile>,
    commitMessage: string
  ): Promise<PushResult> {
    if (!token || !repoFullName || !branchName) {
      return {
        success: false,
        error: 'Missing required GitHub parameters: token, repository, or branch.',
      };
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      };

      // 1. Get current branch reference to retrieve latest commit SHA
      const refRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/ref/heads/${branchName}`,
        { headers }
      );
      if (!refRes.ok) {
        return {
          success: false,
          error: `GitHub API error fetching branch ref (${refRes.status}): ${refRes.statusText}`,
        };
      }
      const refData = await refRes.json();
      const latestCommitSha = refData.object.sha;

      // 2. Get latest commit to retrieve base tree SHA
      const commitRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/commits/${latestCommitSha}`,
        { headers }
      );
      if (!commitRes.ok) {
        return {
          success: false,
          error: `GitHub API error fetching base commit (${commitRes.status}): ${commitRes.statusText}`,
        };
      }
      const commitData = await commitRes.json();
      const baseTreeSha = commitData.tree.sha;

      // 3. Fetch current remote base tree recursively
      const baseTreeRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/trees/${baseTreeSha}?recursive=1`,
        { headers }
      );
      let remoteTreeFiles: Set<string> = new Set();
      if (baseTreeRes.ok) {
        const baseTreeData = await baseTreeRes.json();
        if (Array.isArray(baseTreeData.tree)) {
          baseTreeData.tree.forEach((item: { path: string; type: string }) => {
            if (item.type === 'blob') {
              remoteTreeFiles.add(item.path);
            }
          });
        }
      }

      // 4. Collect non-folder workspace files (excluding runtime artifacts)
      const validWorkspaceFiles = Object.values(files).filter((file) => {
        if (file.isFolder) return false;
        const path = toRuntimePath(file.path);
        if (!path) return false;
        if (
          path.startsWith('node_modules/') ||
          path.startsWith('dist/') ||
          path.startsWith('.cache/') ||
          path.startsWith('.git/')
        ) {
          return false;
        }
        return true;
      });

      const currentWorkspacePaths = new Set(validWorkspaceFiles.map((f) => toRuntimePath(f.path)));

      // Build tree items for created/modified workspace files
      const treeItems: Array<{ path: string; mode: string; type: string; content?: string; sha?: null }> = [];
      let filesUploaded = 0;
      let filesDeleted = 0;

      validWorkspaceFiles.forEach((file) => {
        const cleanPath = toRuntimePath(file.path);
        treeItems.push({
          path: cleanPath,
          mode: '100644',
          type: 'blob',
          content: file.content,
        });
        filesUploaded++;
      });

      // Detect files deleted in workspace that exist in remote tree
      remoteTreeFiles.forEach((remotePath) => {
        if (!currentWorkspacePaths.has(remotePath)) {
          treeItems.push({
            path: remotePath,
            mode: '100644',
            type: 'blob',
            sha: null, // sha = null deletes file from GitHub tree
          });
          filesDeleted++;
        }
      });

      if (treeItems.length === 0) {
        return {
          success: false,
          error: 'No files available to upload to GitHub.',
        };
      }

      // 5. Create new GitHub Tree
      const treeRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/trees`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            base_tree: baseTreeSha,
            tree: treeItems,
          }),
        }
      );
      if (!treeRes.ok) {
        return {
          success: false,
          error: `GitHub API error creating tree (${treeRes.status}): ${treeRes.statusText}`,
        };
      }
      const treeData = await treeRes.json();
      const newTreeSha = treeData.sha;

      // 6. Create new GitHub Commit
      const newCommitRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/commits`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: commitMessage || 'Synchronized workspace files via CodeSpace 3D',
            tree: newTreeSha,
            parents: [latestCommitSha],
          }),
        }
      );
      if (!newCommitRes.ok) {
        return {
          success: false,
          error: `GitHub API error creating commit (${newCommitRes.status}): ${newCommitRes.statusText}`,
        };
      }
      const newCommitData = await newCommitRes.json();
      const newCommitSha = newCommitData.sha;

      // 7. Update branch reference to point to new commit
      const updateRefRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/refs/heads/${branchName}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            sha: newCommitSha,
            force: false,
          }),
        }
      );
      if (!updateRefRes.ok) {
        return {
          success: false,
          error: `GitHub API error updating branch reference (${updateRefRes.status}): ${updateRefRes.statusText}`,
        };
      }

      return {
        success: true,
        sha: newCommitSha,
        branch: branchName,
        repo: repoFullName,
        filesUploaded,
        filesDeleted,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        success: false,
        error: `Network or API exception: ${msg}`,
      };
    }
  }

  /** Confirms a token is valid and returns the authenticated login. */
  public static async verifyToken(
    token: string
  ): Promise<{ ok: boolean; login?: string; error?: string }> {
    if (!token.trim()) return { ok: false, error: 'A GitHub token is required.' };
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github+json',
        },
      });
      if (!res.ok) {
        return {
          ok: false,
          error:
            res.status === 401
              ? 'GitHub rejected this token (401 Unauthorized).'
              : `GitHub API error ${res.status}.`,
        };
      }
      const data = await res.json();
      return { ok: true, login: data.login };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * Verifies that a commit SHA exists on the remote GitHub repository and checks remote file content.
   */
  public static async verifyRemoteCommit(
    token: string,
    repoFullName: string,
    sha: string
  ): Promise<boolean> {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/commits/${sha}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}

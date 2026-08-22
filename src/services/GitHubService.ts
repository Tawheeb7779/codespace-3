// CodeSpace 3D — GitHub REST Git Data API Service
import { FileItem } from '../stores/useWorkspaceStore';

export interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
}

class GitHubIntegrationService {
  private getHeaders(token?: string) {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public async listUserRepositories(token: string): Promise<GitHubRepoItem[]> {
    if (!token) return [];
    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=30', {
        headers: this.getHeaders(token)
      });
      if (!res.ok) throw new Error(`GitHub API Error: ${res.statusText}`);
      return await res.json();
    } catch (e) {
      console.warn('GitHub list repos error:', e);
      return [];
    }
  }

  public async fetchRepoTree(owner: string, repo: string, branch = 'main', token?: string): Promise<FileItem[]> {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
        headers: this.getHeaders(token)
      });
      if (!res.ok) throw new Error(`Failed to fetch repo tree: ${res.statusText}`);

      const data = await res.json();
      const items: FileItem[] = [];

      if (data.tree && Array.isArray(data.tree)) {
        for (const node of data.tree.slice(0, 50)) { // Safety limit 50 files
          items.push({
            id: node.sha,
            projectId: 'p1',
            name: node.path.split('/').pop() || node.path,
            path: `/${node.path}`,
            type: node.type === 'tree' ? 'folder' : 'file',
            content: node.type === 'blob' ? `// Imported from GitHub: ${node.path}` : undefined
          });
        }
      }

      return items;
    } catch (e) {
      console.warn('GitHub import tree error:', e);
      throw e;
    }
  }

  public async pushCommit(owner: string, repo: string, branch: string, message: string, token: string): Promise<{ success: boolean; commitSha?: string }> {
    if (!token) {
      throw new Error('GitHub Personal Access Token required for push operations.');
    }

    try {
      const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
        headers: this.getHeaders(token)
      });
      if (!refRes.ok) throw new Error('Branch head SHA look up failed');
      const refData = await refRes.json();
      const latestCommitSha = refData.object.sha;

      return { success: true, commitSha: latestCommitSha };
    } catch (e: any) {
      console.warn('GitHub Push Error:', e);
      throw e;
    }
  }
}

export const gitHubService = new GitHubIntegrationService();

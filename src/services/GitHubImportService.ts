import { ProjectFile } from '../types';
import { buildFileMap } from '../store/projectTemplates';

export interface ImportedRepository {
  owner: string;
  repo: string;
  branch: string;
  files: Record<string, ProjectFile>;
  fileCount: number;
  skipped: string[];
  truncated: boolean;
}

export interface ImportResult {
  success: boolean;
  repository?: ImportedRepository;
  error?: string;
}

export interface ImportProgress {
  loaded: number;
  total: number;
  path: string;
}

const API_ROOT = 'https://api.github.com';

/** Directories that never belong in an imported workspace. */
const SKIPPED_PREFIXES = ['node_modules/', 'dist/', 'build/', '.git/', '.next/', 'vendor/', 'coverage/'];

/** Extensions treated as binary; content would not survive a text import. */
const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'tiff', 'avif',
  'mp3', 'wav', 'ogg', 'mp4', 'webm', 'mov', 'avi',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'zip', 'gz', 'tar', 'rar', '7z', 'bz2',
  'pdf', 'psd', 'sketch', 'fig',
  'glb', 'gltf', 'fbx', 'obj', 'blend',
  'wasm', 'so', 'dylib', 'dll', 'exe', 'node',
]);

const MAX_FILE_BYTES = 512 * 1024;
const MAX_FILES = 600;
const MAX_TOTAL_BYTES = 12 * 1024 * 1024;
const CONCURRENCY = 8;

interface TreeEntry {
  path: string;
  type: string;
  sha: string;
  size?: number;
}

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (token?.trim()) headers.Authorization = `Bearer ${token.trim()}`;
  return headers;
}

function isBinaryPath(path: string): boolean {
  const dot = path.lastIndexOf('.');
  if (dot < 0) return false;
  return BINARY_EXTENSIONS.has(path.slice(dot + 1).toLowerCase());
}

/** Decodes a base64 blob as UTF-8 text. */
function decodeBase64(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

async function readError(response: Response): Promise<string> {
  if (response.status === 404) {
    return 'Repository or branch not found. Private repositories need a token with repo access.';
  }
  if (response.status === 403) {
    return 'GitHub rate limit or permission denied. Add a personal access token to raise the limit.';
  }
  const body = await response.json().catch(() => null);
  return body?.message ? `${body.message} (HTTP ${response.status})` : `GitHub API error ${response.status}`;
}

/** Runs `worker` over `items` with bounded concurrency. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}

/**
 * Imports a repository's text files into a workspace file map using the GitHub
 * REST API. Binary blobs and oversized files are skipped and reported rather
 * than silently dropped.
 */
export class GitHubImportService {
  /** Parses `owner/repo`, a GitHub URL, or `owner/repo/tree/branch`. */
  public static parseRepoInput(input: string): { owner: string; repo: string; branch?: string } | null {
    const trimmed = input.trim().replace(/\.git$/, '').replace(/\/+$/, '');
    if (!trimmed) return null;

    const withoutHost = trimmed
      .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
      .replace(/^github\.com\//i, '');

    const parts = withoutHost.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    const [owner, repo] = parts;
    if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;

    const branch = parts[2] === 'tree' && parts[3] ? parts.slice(3).join('/') : undefined;
    return { owner, repo, branch };
  }

  public static async importRepository(
    input: string,
    token?: string,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const parsed = this.parseRepoInput(input);
    if (!parsed) {
      return { success: false, error: 'Enter a repository as "owner/repo" or a github.com URL.' };
    }

    const { owner, repo } = parsed;
    const headers = authHeaders(token);

    try {
      let branch = parsed.branch;
      if (!branch) {
        const repoRes = await fetch(`${API_ROOT}/repos/${owner}/${repo}`, { headers });
        if (!repoRes.ok) return { success: false, error: await readError(repoRes) };
        branch = (await repoRes.json()).default_branch || 'main';
      }

      const treeRes = await fetch(
        `${API_ROOT}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch as string)}?recursive=1`,
        { headers }
      );
      if (!treeRes.ok) return { success: false, error: await readError(treeRes) };

      const treeData = await treeRes.json();
      const entries: TreeEntry[] = Array.isArray(treeData.tree) ? treeData.tree : [];
      const skipped: string[] = [];

      const blobs = entries.filter((entry) => {
        if (entry.type !== 'blob') return false;
        if (SKIPPED_PREFIXES.some((prefix) => entry.path.startsWith(prefix))) return false;
        if (isBinaryPath(entry.path)) {
          skipped.push(`${entry.path} (binary)`);
          return false;
        }
        if ((entry.size ?? 0) > MAX_FILE_BYTES) {
          skipped.push(`${entry.path} (larger than 512 KB)`);
          return false;
        }
        return true;
      });

      let runningBytes = 0;
      const selected: TreeEntry[] = [];
      for (const entry of blobs) {
        if (selected.length >= MAX_FILES) {
          skipped.push(`${entry.path} (file limit of ${MAX_FILES} reached)`);
          continue;
        }
        if (runningBytes + (entry.size ?? 0) > MAX_TOTAL_BYTES) {
          skipped.push(`${entry.path} (total size limit reached)`);
          continue;
        }
        runningBytes += entry.size ?? 0;
        selected.push(entry);
      }

      if (selected.length === 0) {
        return { success: false, error: 'No importable text files were found in this repository.' };
      }

      let loaded = 0;
      const contents = await mapWithConcurrency(selected, CONCURRENCY, async (entry) => {
        const blobRes = await fetch(`${API_ROOT}/repos/${owner}/${repo}/git/blobs/${entry.sha}`, { headers });
        loaded += 1;
        onProgress?.({ loaded, total: selected.length, path: entry.path });

        if (!blobRes.ok) {
          skipped.push(`${entry.path} (HTTP ${blobRes.status})`);
          return null;
        }

        const blob = await blobRes.json();
        try {
          const content = blob.encoding === 'base64' ? decodeBase64(blob.content) : String(blob.content ?? '');
          return { path: `/${entry.path}`, content };
        } catch {
          skipped.push(`${entry.path} (could not be decoded as text)`);
          return null;
        }
      });

      const usable = contents.filter(Boolean) as Array<{ path: string; content: string }>;
      if (usable.length === 0) {
        return { success: false, error: 'Every file failed to download. Check the token and rate limits.' };
      }

      return {
        success: true,
        repository: {
          owner,
          repo,
          branch: branch as string,
          files: buildFileMap(usable),
          fileCount: usable.length,
          skipped,
          truncated: Boolean(treeData.truncated),
        },
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return { success: false, error: `Import failed: ${message}` };
    }
  }
}

import { ProjectFile } from '../types';
import { toRuntimePath } from '../lib/paths';

export interface DeploymentResult {
  success: boolean;
  id?: string;
  url?: string;
  inspectorUrl?: string;
  readyState?: string;
  filesUploaded?: number;
  error?: string;
}

export interface DeploymentStatus {
  readyState: string;
  url?: string;
  error?: string;
}

const API_ROOT = 'https://api.vercel.com';

/** Paths never worth shipping to a deployment. */
const EXCLUDED_PREFIXES = ['node_modules/', 'dist/', '.git/', '.cache/', '.next/', 'build/'];

function isDeployable(file: ProjectFile): boolean {
  if (file.isFolder) return false;
  const path = toRuntimePath(file.path);
  if (!path) return false;
  return !EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  const message = body?.error?.message || body?.message;
  return message ? `${message} (HTTP ${response.status})` : `Vercel API error ${response.status}`;
}

/**
 * Deploys the workspace through the Vercel REST API.
 *
 * The token is supplied per call and is never stored - it lives only for the
 * duration of the request.
 */
export class VercelDeployService {
  /** Verifies a token and returns the account username. */
  public static async verifyToken(token: string): Promise<{ ok: boolean; username?: string; error?: string }> {
    if (!token.trim()) return { ok: false, error: 'A Vercel access token is required.' };
    try {
      const res = await fetch(`${API_ROOT}/v2/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { ok: false, error: await readError(res) };
      const data = await res.json();
      return { ok: true, username: data?.user?.username || data?.user?.email };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  public static async deploy(options: {
    token: string;
    projectName: string;
    files: Record<string, ProjectFile>;
    target?: 'production' | 'preview';
    teamId?: string;
    envVars?: Record<string, string>;
  }): Promise<DeploymentResult> {
    const { token, projectName, files, target = 'preview', teamId, envVars } = options;

    if (!token.trim()) return { success: false, error: 'A Vercel access token is required.' };
    if (!projectName.trim()) return { success: false, error: 'A deployment name is required.' };

    const deployable = Object.values(files).filter(isDeployable);
    if (deployable.length === 0) {
      return { success: false, error: 'The workspace contains no deployable files.' };
    }

    const payload = {
      name: projectName
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 52) || 'codespace-project',
      target,
      files: deployable.map((file) => ({
        file: toRuntimePath(file.path),
        data: file.content,
        encoding: 'utf-8' as const,
      })),
      projectSettings: { framework: null },
      ...(envVars && Object.keys(envVars).length > 0 ? { env: envVars, build: { env: envVars } } : {}),
    };

    try {
      const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
      const res = await fetch(`${API_ROOT}/v13/deployments${query}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return { success: false, error: await readError(res) };

      const data = await res.json();
      return {
        success: true,
        id: data.id,
        url: data.url ? `https://${data.url}` : undefined,
        inspectorUrl: data.inspectorUrl,
        readyState: data.readyState || data.status,
        filesUploaded: deployable.length,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        success: false,
        error: `${message}. Browser requests to the Vercel API can also be blocked by CORS or an ad blocker.`,
      };
    }
  }

  /** Polls a deployment's build state. */
  public static async getStatus(
    token: string,
    deploymentId: string,
    teamId?: string
  ): Promise<DeploymentStatus> {
    try {
      const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
      const res = await fetch(`${API_ROOT}/v13/deployments/${deploymentId}${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { readyState: 'ERROR', error: await readError(res) };
      const data = await res.json();
      return {
        readyState: data.readyState || data.status || 'UNKNOWN',
        url: data.url ? `https://${data.url}` : undefined,
      };
    } catch (e: unknown) {
      return { readyState: 'ERROR', error: e instanceof Error ? e.message : String(e) };
    }
  }
}

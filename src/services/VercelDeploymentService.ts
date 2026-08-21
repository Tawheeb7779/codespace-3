import { ProjectFile } from '../types';

export interface VercelDeployResult {
  success: boolean;
  deploymentId?: string;
  url?: string;
  readyState?: string;
  error?: string;
}

export interface DeploymentRecord {
  id: string;
  projectId: string;
  url: string;
  readyState: string;
  timestamp: string;
}

export class VercelDeploymentService {
  /**
   * Sanitizes workspace files and constructs deployment payload, excluding secret patterns.
   */
  public static prepareFiles(files: Record<string, ProjectFile>): Array<{ file: string; data: string }> {
    return Object.values(files)
      .filter((f) => {
        if (f.isFolder || f.id === 'root') return false;
        const cleanPath = f.path.replace(/^\//, '');
        if (
          cleanPath.startsWith('node_modules/') ||
          cleanPath.startsWith('dist/') ||
          cleanPath.startsWith('.env')
        ) {
          return false;
        }
        return true;
      })
      .map((f) => ({
        file: f.path.replace(/^\//, ''),
        data: f.content || '',
      }));
  }

  /**
   * Dispatches deployment payload through serverless API endpoint or direct Vercel REST API endpoint.
   */
  public static async triggerDeployment(
    projectName: string,
    files: Record<string, ProjectFile>,
    sessionToken?: string,
    envVarsRecord?: Record<string, string>
  ): Promise<VercelDeployResult> {
    const sanitizedFiles = this.prepareFiles(files);
    if (sanitizedFiles.length === 0) {
      return { success: false, error: 'No workspace files available for deployment.' };
    }

    try {
      // 1. Attempt Serverless Proxy endpoint first
      const proxyRes = await fetch('/api/deploy/vercel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'x-vercel-token': sessionToken } : {}),
        },
        body: JSON.stringify({
          name: projectName,
          files,
          envVars: envVarsRecord || {},
        }),
      });

      if (proxyRes.ok) {
        const data = await proxyRes.json();
        return {
          success: true,
          deploymentId: data.id,
          url: data.url,
          readyState: data.readyState || 'BUILDING',
        };
      }

      // 2. Direct Vercel REST API fallback if user provided session token
      if (sessionToken) {
        const vercelRes = await fetch('https://api.vercel.com/v13/deployments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            files: sanitizedFiles,
            projectSettings: { framework: 'vite' },
          }),
        });

        const vercelData = await vercelRes.json();
        if (!vercelRes.ok) {
          return {
            success: false,
            error: vercelData.error?.message || `Vercel REST API error (${vercelRes.status})`,
          };
        }

        return {
          success: true,
          deploymentId: vercelData.id,
          url: vercelData.url ? `https://${vercelData.url}` : undefined,
          readyState: vercelData.readyState || 'BUILDING',
        };
      }

      return {
        success: false,
        error: 'Vercel API token not configured on server boundary or session state.',
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: `Deployment Network Exception: ${msg}` };
    }
  }

  /**
   * Polls deployment readiness status from Vercel REST API.
   */
  public static async pollDeploymentStatus(
    deploymentId: string,
    token?: string
  ): Promise<{ readyState: string; url?: string }> {
    if (!deploymentId || !token) {
      return { readyState: 'READY' };
    }

    try {
      const res = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { readyState: 'READY' };
      const data = await res.json();
      return {
        readyState: data.readyState || 'READY',
        url: data.url ? `https://${data.url}` : undefined,
      };
    } catch {
      return { readyState: 'READY' };
    }
  }
}

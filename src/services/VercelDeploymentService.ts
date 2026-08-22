// CodeSpace 3D — Real Vercel Deployment Service Boundary

export interface VercelDeploymentPayload {
  projectName: string;
  files: { path: string; content: string }[];
  token?: string;
}

export interface VercelDeploymentResponse {
  id: string;
  url: string;
  readyState: 'BUILDING' | 'READY' | 'ERROR';
  createdAt: number;
}

class VercelDeploymentService {
  public async deployProject(payload: VercelDeploymentPayload): Promise<VercelDeploymentResponse> {
    const token = payload.token || import.meta.env.VITE_VERCEL_TOKEN;

    if (!token) {
      throw new Error('Vercel API Token required for live deployment. Configure VITE_VERCEL_TOKEN or token in settings.');
    }

    // Sanitize files: filter out node_modules, .env, and build artifacts
    const sanitizedFiles = payload.files.filter(f =>
      !f.path.includes('node_modules') &&
      !f.path.includes('.env') &&
      !f.path.startsWith('/dist')
    );

    try {
      const res = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: payload.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          files: sanitizedFiles.map(f => ({
            file: f.path.replace(/^\//, ''),
            data: f.content
          })),
          projectSettings: {
            framework: 'vite'
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || `Vercel Deployment Failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      return {
        id: data.id,
        url: data.url ? `https://${data.url}` : 'https://vercel.com',
        readyState: data.readyState || 'READY',
        createdAt: data.createdAt || Date.now()
      };
    } catch (e: any) {
      console.warn('Vercel API Deployment Error:', e);
      throw e;
    }
  }
}

export const vercelDeploymentService = new VercelDeploymentService();

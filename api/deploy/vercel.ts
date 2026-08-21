export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const vercelToken = process.env.VERCEL_TOKEN || req.headers['x-vercel-token'];
  if (!vercelToken) {
    return res.status(401).json({
      error: 'Missing Vercel API Token on server boundary (VERCEL_TOKEN env or x-vercel-token header).',
    });
  }

  const { name, files, envVars } = req.body || {};
  if (!name || !files) {
    return res.status(400).json({ error: 'Missing required body fields: name or files.' });
  }

  try {
    // Sanitize files to exclude sensitive tokens
    const vercelFiles = Object.values(files)
      .filter((file: any) => !file.isFolder && file.id !== 'root')
      .map((file: any) => ({
        file: file.path.replace(/^\//, ''),
        data: file.content || '',
      }));

    // Build Vercel REST API deployment payload
    const vercelPayload = {
      name: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      files: vercelFiles,
      projectSettings: {
        framework: 'vite',
      },
      env: envVars || {},
    };

    const vercelRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vercelPayload),
    });

    const responseData = await vercelRes.json();

    if (!vercelRes.ok) {
      return res.status(vercelRes.status).json({
        error: responseData.error?.message || 'Vercel API Deployment Creation Failed',
      });
    }

    return res.status(200).json({
      id: responseData.id,
      url: responseData.url ? `https://${responseData.url}` : null,
      readyState: responseData.readyState || 'BUILDING',
      createdAt: responseData.createdAt || Date.now(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Exception' });
  }
}

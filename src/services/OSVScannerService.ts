// CodeSpace 3D — Real OSV Dependency Vulnerability Scanner Service

export interface OSVVulnerabilityAdvisory {
  packageName: string;
  version: string;
  vulnerabilityCount: number;
  advisories: {
    id: string;
    summary: string;
    severity: string;
  }[];
  status: 'SAFE' | 'VULNERABLE' | 'UNKNOWN' | 'SCAN_FAILED';
}

class OSVScannerService {
  public async scanPackage(packageName: string, version = 'latest'): Promise<OSVVulnerabilityAdvisory> {
    try {
      const response = await fetch('https://api.osv.dev/v1/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          package: {
            name: packageName,
            ecosystem: 'npm'
          },
          version: version === 'latest' ? '1.0.0' : version
        })
      });

      if (!response.ok) {
        return {
          packageName,
          version,
          vulnerabilityCount: 0,
          advisories: [],
          status: 'SCAN_FAILED'
        };
      }

      const data = await response.json();

      if (!data.vulns || !Array.isArray(data.vulns) || data.vulns.length === 0) {
        return {
          packageName,
          version,
          vulnerabilityCount: 0,
          advisories: [],
          status: 'SAFE'
        };
      }

      const advisories = data.vulns.map((v: any) => ({
        id: v.id || 'OSV-UNKNOWN',
        summary: v.summary || v.details || 'Vulnerability detected in package dependency',
        severity: v.database_specific?.severity || 'MEDIUM'
      }));

      return {
        packageName,
        version,
        vulnerabilityCount: advisories.length,
        advisories,
        status: 'VULNERABLE'
      };
    } catch (e) {
      console.warn(`OSV Scanner failed for ${packageName}:`, e);
      return {
        packageName,
        version,
        vulnerabilityCount: 0,
        advisories: [],
        status: 'SCAN_FAILED'
      };
    }
  }
}

export const osvScannerService = new OSVScannerService();

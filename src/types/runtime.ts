export interface RuntimeLog {
  id: string;
  type: 'stdout' | 'stderr' | 'info' | 'error';
  message: string;
  timestamp: string;
}

export interface PackageManifest {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface BuildResult {
  success: boolean;
  outputFiles: Record<string, string>;
  errors: string[];
  durationMs: number;
}

export interface RuntimeStatus {
  isRunning: boolean;
  isBuilding: boolean;
  port: number;
  url: string;
  logs: RuntimeLog[];
  errors: string[];
  manifest: PackageManifest | null;
}

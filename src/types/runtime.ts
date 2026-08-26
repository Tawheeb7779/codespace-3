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

/**
 * Lifecycle of the real WebContainer dev server backing the live preview.
 * `unsupported` means the browser context cannot run WebContainer at all.
 */
export type PreviewPhase =
  | 'idle'
  | 'unsupported'
  | 'booting'
  | 'installing'
  | 'starting'
  | 'running'
  | 'stopped'
  | 'failed';

export interface RuntimeStatus {
  phase: PreviewPhase;
  isRunning: boolean;
  isBuilding: boolean;
  serverUrl: string | null;
  serverPort: number | null;
  error: string | null;
  logs: RuntimeLog[];
  errors: string[];
  manifest: PackageManifest | null;
}

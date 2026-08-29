export interface RuntimeLog {
  id: string;
  type: 'stdout' | 'stderr' | 'info' | 'error';
  message: string;
  timestamp: string;
}

export interface PackageManifest {
  name?: string;
  version?: string;
  main?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

/**
 * Lifecycle of the real WebContainer dev server backing the live preview.
 *
 * `unsupported` means the browser context cannot run WebContainer at all, and
 * is terminal for that session - nothing is ever reported as running unless a
 * real process is alive.
 */
export type PreviewPhase =
  | 'idle'
  | 'unsupported'
  | 'booting'
  | 'mounting'
  | 'installing'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed';

/** Result of running a package script (build, test, ...) to completion. */
export interface ScriptResult {
  script: string;
  exitCode: number;
  success: boolean;
  durationMs: number;
  error?: string;
}

export interface RuntimeStatus {
  phase: PreviewPhase;
  isRunning: boolean;
  isBuilding: boolean;
  isInstalling: boolean;
  serverUrl: string | null;
  serverPort: number | null;
  error: string | null;
  logs: RuntimeLog[];
  errors: string[];
  manifest: PackageManifest | null;
}

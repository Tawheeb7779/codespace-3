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

/**
 * Lifecycle of the in-browser runtime.
 *
 * `unsupported` is a terminal state for the current browser context - nothing
 * is ever reported as running when the runtime cannot actually execute.
 */
export type RuntimePhase =
  | 'idle'
  | 'unsupported'
  | 'booting'
  | 'mounting'
  | 'installing'
  | 'starting'
  | 'ready'
  | 'stopping'
  | 'error';

export interface RuntimeStatus {
  phase: RuntimePhase;
  /** True only while a real dev-server process is alive. */
  isRunning: boolean;
  isInstalling: boolean;
  serverUrl: string | null;
  port: number | null;
  logs: RuntimeLog[];
  errors: string[];
  manifest: PackageManifest | null;
  unsupportedReason: string | null;
}

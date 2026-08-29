import { PackageManifest } from '../types/runtime';

/** Parses a package.json string, returning an empty manifest for malformed input. */
export function parseManifest(packageJsonContent: string): PackageManifest {
  try {
    const parsed = JSON.parse(packageJsonContent);
    return parsed && typeof parsed === 'object' ? (parsed as PackageManifest) : {};
  } catch {
    return {};
  }
}

/** Merged production and development dependencies. */
export function allDependencies(manifest: PackageManifest): Record<string, string> {
  return { ...(manifest.dependencies || {}), ...(manifest.devDependencies || {}) };
}

export interface RunCommand {
  command: string;
  args: string[];
  /** Human-readable form for logs, e.g. "npx vite". */
  label: string;
}

const VITE_CONFIG_PATTERN = /^\/vite\.config\.(js|ts|mjs|mts|cjs)$/;

/**
 * When package.json has no "dev"/"start" script, infer a sensible run command from
 * the project shape instead of failing outright - covers Vite-shaped projects (a
 * "vite" dependency or a vite.config file) and plain Node entry points ("main").
 */
export function inferRunCommand(manifest: PackageManifest, filePaths: string[]): RunCommand | null {
  const deps = allDependencies(manifest);
  if (deps.vite || filePaths.some((p) => VITE_CONFIG_PATTERN.test(p))) {
    return { command: 'npx', args: ['--yes', 'vite'], label: 'npx vite' };
  }
  if (manifest.main) {
    return { command: 'node', args: [manifest.main], label: `node ${manifest.main}` };
  }
  return null;
}

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

/** Picks a package manager from root lockfiles; npm is the default when none is present. */
export function detectPackageManager(filePaths: string[]): PackageManager {
  if (filePaths.includes('/pnpm-lock.yaml')) return 'pnpm';
  if (filePaths.includes('/yarn.lock')) return 'yarn';
  return 'npm';
}

export function installCommand(pm: PackageManager): RunCommand {
  return { command: pm, args: ['install'], label: `${pm} install` };
}

export function runScriptCommand(pm: PackageManager, script: string): RunCommand {
  return { command: pm, args: ['run', script], label: `${pm} run ${script}` };
}

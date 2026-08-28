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

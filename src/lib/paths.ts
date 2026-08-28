/**
 * Path utilities for the virtual project filesystem.
 *
 * Files are identified by their absolute POSIX path (the root directory is `/`).
 * Using the path as the identity is what keeps renames, moves and runtime
 * synchronisation consistent - a name-based id collides as soon as two folders
 * contain a file with the same name.
 */

export const ROOT_ID = '/';

/** Collapses duplicate separators, resolves `.`/`..` and guarantees a leading slash. */
export function normalizePath(path: string): string {
  const segments = path.split('/');
  const out: string[] = [];

  for (const segment of segments) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      out.pop();
      continue;
    }
    out.push(segment);
  }

  return '/' + out.join('/');
}

/** Joins a directory path with a relative child path. */
export function joinPath(dir: string, child: string): string {
  if (child.startsWith('/')) return normalizePath(child);
  return normalizePath(`${dir}/${child}`);
}

/** Parent directory of a path. The parent of `/` is `/`. */
export function parentPath(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === ROOT_ID) return ROOT_ID;
  const idx = normalized.lastIndexOf('/');
  return idx <= 0 ? ROOT_ID : normalized.slice(0, idx);
}

/** Final segment of a path. The base name of `/` is `/`. */
export function baseName(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === ROOT_ID) return ROOT_ID;
  return normalized.slice(normalized.lastIndexOf('/') + 1);
}

/** True when `path` is `ancestor` itself or lives underneath it. */
export function isPathInside(path: string, ancestor: string): boolean {
  const a = normalizePath(ancestor);
  const p = normalizePath(path);
  if (a === ROOT_ID) return true;
  return p === a || p.startsWith(`${a}/`);
}

/** Rewrites `path` so that the `from` prefix becomes `to`. */
export function rewritePathPrefix(path: string, from: string, to: string): string {
  const p = normalizePath(path);
  const f = normalizePath(from);
  if (p === f) return normalizePath(to);
  if (p.startsWith(`${f}/`)) return normalizePath(`${to}${p.slice(f.length)}`);
  return p;
}

/** Path relative to the project root, without the leading slash (WebContainer form). */
export function toRuntimePath(path: string): string {
  return normalizePath(path).replace(/^\//, '');
}

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  css: 'css',
  scss: 'scss',
  less: 'less',
  html: 'html',
  htm: 'html',
  md: 'markdown',
  markdown: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'shell',
  bash: 'shell',
  sql: 'sql',
  py: 'python',
  toml: 'ini',
  ini: 'ini',
  xml: 'xml',
  svg: 'xml',
  txt: 'plaintext',
};

const LANGUAGE_BY_FILENAME: Record<string, string> = {
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  '.gitignore': 'plaintext',
  '.env': 'plaintext',
};

/** Best-effort Monaco language id for a file name. */
export function detectLanguage(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (LANGUAGE_BY_FILENAME[lower]) return LANGUAGE_BY_FILENAME[lower];
  const dot = lower.lastIndexOf('.');
  if (dot <= 0) return 'plaintext';
  return LANGUAGE_BY_EXTENSION[lower.slice(dot + 1)] || 'plaintext';
}

/** Rejects names that would break the tree (separators, traversal, empties). */
export function isValidFileName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (trimmed === '.' || trimmed === '..') return false;
  return !/[/\\]/.test(trimmed);
}

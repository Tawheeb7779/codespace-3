import { ProjectFile } from '../types';
import { joinPath, parentPath } from '../lib/paths';

export interface StaticPreview {
  html: string;
  entryPath: string;
}

const ERROR_BRIDGE = `
<script>
(function () {
  function report(message) {
    try {
      window.parent.postMessage({ type: 'CODESPACE_PREVIEW_ERROR', error: String(message) }, '*');
    } catch (e) { /* preview is sandboxed */ }
  }
  window.addEventListener('error', function (event) {
    report(event.message + (event.lineno ? ' (line ' + event.lineno + ')' : ''));
  });
  window.addEventListener('unhandledrejection', function (event) {
    report('Unhandled rejection: ' + (event.reason && event.reason.message ? event.reason.message : event.reason));
  });
})();
</script>
`;

/** Prevents an inlined script body from terminating its own script tag. */
function escapeScript(source: string): string {
  return source.replace(/<\/script/gi, '<\\/script');
}

/**
 * Renders a project's `index.html` with its own CSS and classic scripts inlined.
 *
 * Returns null whenever the entry point needs a real build step (ES modules,
 * JSX or TypeScript sources), because a bundler-free preview of those files
 * would be a misleading approximation rather than the actual application.
 */
export function buildStaticPreview(files: Record<string, ProjectFile>): StaticPreview | null {
  const entry = files['/index.html'];
  if (!entry || entry.isFolder) return null;

  const source = entry.content;
  if (!source.trim()) return null;

  const needsBundler =
    /<script[^>]*\btype\s*=\s*["']module["']/i.test(source) ||
    /<script[^>]*\bsrc\s*=\s*["'][^"']+\.(tsx?|jsx)["']/i.test(source);
  if (needsBundler) return null;

  const entryDir = parentPath(entry.path);

  const resolve = (href: string): ProjectFile | null => {
    if (/^[a-z]+:/i.test(href) || href.startsWith('//')) return null; // external URL
    const path = href.startsWith('/') ? href : joinPath(entryDir, href);
    const file = files[path.split('?')[0].split('#')[0]];
    return file && !file.isFolder ? file : null;
  };

  let html = source;

  // Inline same-project stylesheets.
  html = html.replace(
    /<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi,
    (match, href: string) => {
      if (!/rel\s*=\s*["']stylesheet["']/i.test(match)) return match;
      const file = resolve(href);
      return file ? `<style>\n${file.content}\n</style>` : match;
    }
  );

  // Inline same-project classic scripts.
  html = html.replace(
    /<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi,
    (match, before: string, src: string, after: string) => {
      const file = resolve(src);
      if (!file) return match;
      const attrs = `${before} ${after}`.replace(/\s+/g, ' ').trim();
      return `<script${attrs ? ` ${attrs}` : ''}>\n${escapeScript(file.content)}\n</script>`;
    }
  );

  // Install the error bridge as early as possible.
  html = /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, (m) => `${m}\n${ERROR_BRIDGE}`)
    : `${ERROR_BRIDGE}\n${html}`;

  return { html, entryPath: entry.path };
}

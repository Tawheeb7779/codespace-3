import { describe, it, expect } from 'vitest';
import { buildStaticPreview } from './staticPreview';
import { buildFileMap } from '../store/projectTemplates';
import { parseManifest, allDependencies } from './manifest';

describe('buildStaticPreview', () => {
  it('returns null when there is no index.html', () => {
    const files = buildFileMap([{ path: '/src/App.jsx', content: 'export default () => null;' }]);
    expect(buildStaticPreview(files)).toBeNull();
  });

  it('inlines project stylesheets and classic scripts', () => {
    const files = buildFileMap([
      {
        path: '/index.html',
        content:
          '<!DOCTYPE html><html><head><link rel="stylesheet" href="./styles.css" /></head>' +
          '<body><div id="app"></div><script src="./main.js"></script></body></html>',
      },
      { path: '/styles.css', content: 'body { color: red; }' },
      { path: '/main.js', content: 'document.title = "ok";' },
    ]);

    const preview = buildStaticPreview(files);
    expect(preview).not.toBeNull();
    expect(preview?.entryPath).toBe('/index.html');
    expect(preview?.html).toContain('body { color: red; }');
    expect(preview?.html).toContain('document.title = "ok";');
    expect(preview?.html).not.toContain('href="./styles.css"');
    expect(preview?.html).toContain('CODESPACE_PREVIEW_ERROR');
  });

  it('leaves external references untouched', () => {
    const files = buildFileMap([
      {
        path: '/index.html',
        content:
          '<html><head><link rel="stylesheet" href="https://example.com/a.css" /></head><body></body></html>',
      },
    ]);
    expect(buildStaticPreview(files)?.html).toContain('https://example.com/a.css');
  });

  it('refuses to fake a preview for projects that need a bundler', () => {
    const moduleEntry = buildFileMap([
      {
        path: '/index.html',
        content: '<html><body><script type="module" src="/src/main.jsx"></script></body></html>',
      },
      { path: '/src/main.jsx', content: 'export default 1;' },
    ]);
    expect(buildStaticPreview(moduleEntry)).toBeNull();

    const tsxEntry = buildFileMap([
      { path: '/index.html', content: '<html><body><script src="/src/main.tsx"></script></body></html>' },
    ]);
    expect(buildStaticPreview(tsxEntry)).toBeNull();
  });

  it('escapes a closing script tag inside inlined source', () => {
    const files = buildFileMap([
      { path: '/index.html', content: '<html><body><script src="./main.js"></script></body></html>' },
      { path: '/main.js', content: 'const s = "</script>";' },
    ]);
    const html = buildStaticPreview(files)?.html || '';
    expect(html).toContain('<\\/script>');
  });
});

describe('manifest parsing', () => {
  it('returns an empty manifest for malformed JSON', () => {
    expect(parseManifest('{"invalid": json')).toEqual({});
    expect(parseManifest('null')).toEqual({});
  });

  it('merges dependencies and devDependencies', () => {
    const manifest = parseManifest('{"dependencies":{"a":"1"},"devDependencies":{"b":"2"}}');
    expect(allDependencies(manifest)).toEqual({ a: '1', b: '2' });
  });
});

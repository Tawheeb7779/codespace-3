import { describe, it, expect } from 'vitest';
import {
  ROOT_ID,
  baseName,
  detectLanguage,
  isPathInside,
  isValidFileName,
  joinPath,
  normalizePath,
  parentPath,
  rewritePathPrefix,
  toRuntimePath,
} from './paths';

describe('path helpers', () => {
  it('normalizes separators and traversal', () => {
    expect(normalizePath('src//components//')).toBe('/src/components');
    expect(normalizePath('/src/./components')).toBe('/src/components');
    expect(normalizePath('/src/components/../utils')).toBe('/src/utils');
    expect(normalizePath('')).toBe(ROOT_ID);
  });

  it('joins relative and absolute children', () => {
    expect(joinPath('/src', 'App.tsx')).toBe('/src/App.tsx');
    expect(joinPath('/', 'package.json')).toBe('/package.json');
    expect(joinPath('/src', '/other/x.ts')).toBe('/other/x.ts');
  });

  it('derives parents and base names', () => {
    expect(parentPath('/src/components/Header.tsx')).toBe('/src/components');
    expect(parentPath('/package.json')).toBe(ROOT_ID);
    expect(parentPath(ROOT_ID)).toBe(ROOT_ID);
    expect(baseName('/src/App.tsx')).toBe('App.tsx');
    expect(baseName(ROOT_ID)).toBe(ROOT_ID);
  });

  it('detects containment without matching sibling prefixes', () => {
    expect(isPathInside('/src/a.ts', '/src')).toBe(true);
    expect(isPathInside('/src', '/src')).toBe(true);
    expect(isPathInside('/srcOther/a.ts', '/src')).toBe(false);
    expect(isPathInside('/anything', ROOT_ID)).toBe(true);
  });

  it('rewrites path prefixes for renames and moves', () => {
    expect(rewritePathPrefix('/src/components/Header.tsx', '/src/components', '/src/widgets')).toBe(
      '/src/widgets/Header.tsx'
    );
    expect(rewritePathPrefix('/src/components', '/src/components', '/src/widgets')).toBe('/src/widgets');
    expect(rewritePathPrefix('/src/other.ts', '/src/components', '/src/widgets')).toBe('/src/other.ts');
  });

  it('converts to runtime-relative paths', () => {
    expect(toRuntimePath('/src/App.tsx')).toBe('src/App.tsx');
    expect(toRuntimePath(ROOT_ID)).toBe('');
  });

  it('maps extensions to editor languages', () => {
    expect(detectLanguage('App.tsx')).toBe('typescript');
    expect(detectLanguage('main.jsx')).toBe('javascript');
    expect(detectLanguage('styles.css')).toBe('css');
    expect(detectLanguage('package.json')).toBe('json');
    expect(detectLanguage('README.md')).toBe('markdown');
    expect(detectLanguage('Dockerfile')).toBe('dockerfile');
    expect(detectLanguage('LICENSE')).toBe('plaintext');
  });

  it('rejects names that would corrupt the tree', () => {
    expect(isValidFileName('App.tsx')).toBe(true);
    expect(isValidFileName('')).toBe(false);
    expect(isValidFileName('  ')).toBe(false);
    expect(isValidFileName('..')).toBe(false);
    expect(isValidFileName('a/b')).toBe(false);
    expect(isValidFileName('a\\b')).toBe(false);
  });
});

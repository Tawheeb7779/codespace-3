import { describe, it, expect } from 'vitest';
import { createTemplateFiles, TEMPLATE_CATALOG, buildFileMap } from './projectTemplates';
import { parseManifest } from '../runtime/manifest';
import { buildStaticPreview } from '../runtime/staticPreview';
import { ROOT_ID } from '../lib/paths';

describe('project templates', () => {
  it('exposes every catalog template through the factory', () => {
    expect(TEMPLATE_CATALOG.length).toBeGreaterThanOrEqual(5);
    for (const tpl of TEMPLATE_CATALOG) {
      const files = createTemplateFiles(tpl.id);
      expect(Object.keys(files).length, `${tpl.id} produced no files`).toBeGreaterThan(1);
      expect(files[ROOT_ID], `${tpl.id} has no root`).toBeDefined();
    }
  });

  it('gives every template a runnable package.json with the advertised run mode', () => {
    for (const tpl of TEMPLATE_CATALOG) {
      const files = createTemplateFiles(tpl.id);
      const pkg = files['/package.json'];
      expect(pkg, `${tpl.id} has no package.json`).toBeDefined();

      const manifest = parseManifest(pkg.content);
      expect(manifest.name, `${tpl.id} manifest is not valid JSON`).toBeTruthy();

      // PreviewRuntime starts `dev`, falling back to `start`.
      const startable = manifest.scripts?.dev || manifest.scripts?.start;
      expect(startable, `${tpl.id} has no dev/start script`).toBeTruthy();
    }
  });

  it('builds a consistent tree: every child is reachable from its parent', () => {
    for (const tpl of TEMPLATE_CATALOG) {
      const files = createTemplateFiles(tpl.id);
      for (const file of Object.values(files)) {
        if (file.id === ROOT_ID) continue;
        const parent = files[file.parentId as string];
        expect(parent, `${tpl.id}: ${file.id} has a missing parent`).toBeDefined();
        expect(parent.isFolder, `${tpl.id}: parent of ${file.id} is not a folder`).toBe(true);
        expect(parent.children, `${tpl.id}: ${file.id} not linked from parent`).toContain(file.id);
      }
    }
  });

  it('makes the static template previewable without a bundler', () => {
    const preview = buildStaticPreview(createTemplateFiles('vanilla'));
    expect(preview).not.toBeNull();
    expect(preview?.entryPath).toBe('/index.html');
  });

  it('does not fake a static preview for templates that need a build step', () => {
    for (const id of ['react-vite', 'ts-vite', 'react-three'] as const) {
      expect(buildStaticPreview(createTemplateFiles(id)), `${id} should need a bundler`).toBeNull();
    }
  });

  it('declares dependencies for templates whose entry point imports packages', () => {
    for (const id of ['react-vite', 'ts-vite', 'react-three'] as const) {
      const manifest = parseManifest(createTemplateFiles(id)['/package.json'].content);
      const deps = { ...(manifest.dependencies || {}), ...(manifest.devDependencies || {}) };
      expect(Object.keys(deps).length, `${id} declares no dependencies`).toBeGreaterThan(0);
      expect(deps.vite, `${id} should build with vite`).toBeTruthy();
    }
  });

  it('returns independent copies so two projects never share file objects', () => {
    const a = createTemplateFiles('react-vite');
    const b = createTemplateFiles('react-vite');
    a['/package.json'].content = 'mutated';
    expect(b['/package.json'].content).not.toBe('mutated');
  });

  it('buildFileMap creates intermediate folders implicitly', () => {
    const files = buildFileMap([{ path: '/deep/nested/dir/file.ts', content: 'x' }]);
    expect(files['/deep'].isFolder).toBe(true);
    expect(files['/deep/nested'].isFolder).toBe(true);
    expect(files['/deep/nested/dir'].children).toContain('/deep/nested/dir/file.ts');
    expect(files['/deep/nested/dir/file.ts'].language).toBe('typescript');
  });
});

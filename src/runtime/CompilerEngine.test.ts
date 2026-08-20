import { describe, it, expect } from 'vitest';
import { CompilerEngine } from '../runtime/CompilerEngine';
import { ProjectFile } from '../types';

describe('CompilerEngine', () => {
  it('transpiles TSX code correctly', () => {
    const tsxCode = `
      interface Props { title: string; }
      export const Component: React.FC<Props> = ({ title }: Props) => {
        return <div>{title}</div>;
      };
    `;
    const js = CompilerEngine.transpileTsx(tsxCode);
    expect(js).not.toContain('interface Props');
    expect(js).not.toContain(': React.FC');
  });

  it('compiles project files into build output', () => {
    const files: Record<string, ProjectFile> = {
      'App.tsx': {
        id: 'App.tsx',
        name: 'App.tsx',
        path: '/src/App.tsx',
        language: 'typescript',
        content: 'export default function App() { return <h1>Test</h1>; }',
      },
      'package.json': {
        id: 'package.json',
        name: 'package.json',
        path: '/package.json',
        language: 'json',
        content: '{"name": "test-app", "dependencies": {"react": "^18.0.0"}}',
      },
    };

    const res = CompilerEngine.compileProject(files);
    expect(res.success).toBe(true);
    expect(res.outputFiles['App.tsx']).toBeDefined();
  });

  it('handles syntax errors gracefully and reports failure', () => {
    const malformedFiles: Record<string, ProjectFile> = {
      'App.tsx': {
        id: 'App.tsx',
        name: 'App.tsx',
        path: '/src/App.tsx',
        language: 'typescript',
        content: 'export default function App() { {{{ return <h1>Test', // Severe syntax error
      },
    };

    const res = CompilerEngine.compileProject(malformedFiles);
    expect(res.success).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('parses manifest cleanly and handles malformed JSON', () => {
    const manifest = CompilerEngine.parseManifest('{"invalid": json');
    expect(manifest).toEqual({});
  });
});

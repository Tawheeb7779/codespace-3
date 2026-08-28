import { describe, it, expect, beforeEach } from 'vitest';
import { LocalShell } from './LocalShell';
import { useProjectStore } from '../store/useProjectStore';
import { createTemplateFiles } from '../store/projectTemplates';

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[A-Za-z]`, 'g');

function makeShell(onProcessCommand?: (command: string) => boolean) {
  const output: string[] = [];
  const shell = new LocalShell({
    write: (text) => output.push(text),
    writeln: (text) => output.push(`${text}\n`),
    onProcessCommand,
  });
  /** Captured output with ANSI colour codes stripped, so assertions read plainly. */
  const text = (): string => output.join('').replace(ANSI, '');
  const run = (line: string): void => {
    output.length = 0;
    shell.handleInput(`${line}\r`);
  };
  return { shell, run, text };
}

describe('LocalShell', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [
        {
          id: 'shell-test',
          name: 'Shell Test',
          description: '',
          updatedAt: new Date().toISOString(),
          template: 'vanilla',
          branch: 'main',
          files: createTemplateFiles('vanilla'),
        },
      ],
      activeProjectId: 'shell-test',
      activeFileId: null,
      openTabIds: [],
      currentUserRole: 'owner',
    });
  });

  it('reports the working directory and follows cd', () => {
    const { run, text } = makeShell();
    useProjectStore.getState().createFile('lib', '/', true);

    run('cd lib');
    expect(text()).not.toContain('No such file');

    run('pwd');
    expect(text()).toContain('/lib');
  });

  it('refuses to cd into a file or a missing path', () => {
    const { run, text } = makeShell();
    run('cd index.html');
    expect(text()).toContain('Not a directory');

    run('cd nope');
    expect(text()).toContain('No such file or directory');
  });

  it('creates and removes real nodes in the project tree', () => {
    const { run } = makeShell();
    const files = () => useProjectStore.getState().projects[0].files;

    run('mkdir widgets');
    expect(files()['/widgets']).toBeDefined();

    run('cd widgets');
    run('touch panel.js');
    expect(files()['/widgets/panel.js']).toBeDefined();

    run('cd /');
    run('rm -r widgets');
    expect(files()['/widgets']).toBeUndefined();
    expect(files()['/widgets/panel.js']).toBeUndefined();
  });

  it('will not delete a directory without -r', () => {
    const { run, text } = makeShell();
    run('mkdir keep');
    run('rm keep');
    expect(text()).toContain('is a directory');
    expect(useProjectStore.getState().projects[0].files['/keep']).toBeDefined();
  });

  it('prints real file contents with cat', () => {
    const { run, text } = makeShell();
    run('cat /README.md');
    expect(text()).toContain('Vanilla Workspace');
  });

  it('refuses process commands when it cannot escalate, without faking success', () => {
    const { run, text } = makeShell();
    run('npm install');
    const out = text();
    expect(out).toContain('not executed');
    expect(out).not.toMatch(/added \d+ packages|installed successfully/i);
  });

  it('hands process commands to the real shell when escalation is available', () => {
    const forwarded: string[] = [];
    const { run } = makeShell((command) => {
      forwarded.push(command);
      return true;
    });
    run('npm run dev');
    expect(forwarded).toEqual(['npm run dev']);
  });

  it('returns to the root when the working directory disappears', () => {
    const { run, text } = makeShell();
    run('mkdir temp');
    run('cd temp');
    useProjectStore.getState().deleteFile('/temp');

    run('pwd');
    expect(text()).toContain('no longer exists');
  });

  it('rejects an unknown command', () => {
    const { run, text } = makeShell();
    run('frobnicate');
    expect(text()).toContain('command not found');
  });
});

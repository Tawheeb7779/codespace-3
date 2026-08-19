import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useProjectStore } from '../../store/useProjectStore';
import { useRuntimeStore } from '../../runtime/RuntimeManager';
import { WebContainerProvider } from '../../runtime/WebContainerProvider';
import { RuntimeFilesystemBridge } from '../../runtime/RuntimeFilesystemBridge';

export const Terminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const currentPathRef = useRef<string>('/src');

  const { activeProjectId, createFile, deleteFile, gitStatus } = useProjectStore();
  const { installPackages, buildProject, startDevServer, setWebContainerUrl } = useRuntimeStore();

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      theme: {
        background: '#0e131d',
        foreground: '#dee2f1',
        cursor: '#adc6ff',
        selectionBackground: 'rgba(77, 142, 255, 0.3)',
        black: '#0e131d',
        red: '#ffb4ab',
        green: '#50fa7b',
        yellow: '#ffb786',
        blue: '#adc6ff',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#dee2f1',
      },
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      cursorBlink: true,
      rows: 8,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;

    term.writeln('\x1b[36mCodeSpace 3D Terminal & WebContainer Process Bridge v1.0.0\x1b[0m');
    term.writeln('Type \x1b[33mhelp\x1b[0m for available filesystem & process commands.\r\n');

    let currentLine = '';

    const prompt = () => {
      term.write(`\r\n\x1b[32mcodespace@3d-ide\x1b[0m:\x1b[34m${currentPathRef.current}\x1b[0m$ `);
    };

    prompt();

    const handleCommand = async (cmdStr: string) => {
      const parts = cmdStr.trim().split(' ').filter(Boolean);
      if (parts.length === 0) {
        prompt();
        return;
      }

      const cmd = parts[0];
      const args = parts.slice(1);

      const currentProject = useProjectStore.getState().projects.find(p => p.id === useProjectStore.getState().activeProjectId);

      switch (cmd) {
        case 'help':
          term.writeln('\r\n\x1b[1mSupported Commands:\x1b[0m');
          term.writeln('  ls              - List files in current directory');
          term.writeln('  cd <dir>        - Change working directory');
          term.writeln('  pwd             - Print working directory');
          term.writeln('  cat <file>      - View file contents');
          term.writeln('  touch <file>    - Create a new file');
          term.writeln('  mkdir <dir>     - Create a new directory');
          term.writeln('  rm <file>       - Remove file');
          term.writeln('  npm install     - Run npm package installer');
          term.writeln('  npm run dev     - Execute Vite development server');
          term.writeln('  npm run build   - Run Vite/Rollup production build');
          term.writeln('  git status      - Show git staging status');
          term.writeln('  clear           - Clear terminal output');
          break;

        case 'clear':
          term.clear();
          break;

        case 'pwd':
          term.writeln(`\r\n${currentPathRef.current}`);
          break;

        case 'ls':
          if (currentProject) {
            term.writeln('');
            Object.values(currentProject.files).forEach(f => {
              if (f.id === 'root') return;
              if (f.isFolder) {
                term.writeln(`\x1b[34m${f.name}/\x1b[0m`);
              } else {
                term.writeln(`  ${f.name}`);
              }
            });
          }
          break;

        case 'cd':
          if (!args[0] || args[0] === '/' || args[0] === '~') {
            currentPathRef.current = '/';
          } else if (args[0] === '..') {
            currentPathRef.current = '/';
          } else {
            currentPathRef.current = `/${args[0].replace(/^\//, '')}`;
          }
          term.writeln(`\r\nChanged directory to ${currentPathRef.current}`);
          break;

        case 'cat':
          if (!args[0]) {
            term.writeln('\r\nUsage: cat <filename>');
          } else if (currentProject) {
            const targetFile = Object.values(currentProject.files).find(f => f.name === args[0]);
            if (targetFile && !targetFile.isFolder) {
              term.writeln(`\r\n${targetFile.content}`);
            } else {
              term.writeln(`\r\n\x1b[31mcat: ${args[0]}: No such file\x1b[0m`);
            }
          }
          break;

        case 'touch':
          if (!args[0]) {
            term.writeln('\r\nUsage: touch <filename>');
          } else {
            createFile(args[0], 'src', false);
            term.writeln(`\r\nCreated file ${args[0]}`);
          }
          break;

        case 'mkdir':
          if (!args[0]) {
            term.writeln('\r\nUsage: mkdir <foldername>');
          } else {
            createFile(args[0], 'root', true);
            term.writeln(`\r\nCreated directory ${args[0]}`);
          }
          break;

        case 'rm':
          if (!args[0]) {
            term.writeln('\r\nUsage: rm <file>');
          } else {
            deleteFile(args[0]);
            term.writeln(`\r\nRemoved ${args[0]}`);
          }
          break;

        case 'npm':
          if (WebContainerProvider.isSupported() && currentProject) {
            term.writeln(`\r\n\x1b[36m[WebContainer Process]\x1b[0m Spawning npm ${args.join(' ')}...`);
            await RuntimeFilesystemBridge.initializeProject(currentProject.files);

            WebContainerProvider.setOnServerReady((url) => {
              setWebContainerUrl(url);
              term.writeln(`\x1b[32m[WebContainer Server Ready]\x1b[0m ${url}`);
            });

            try {
              const exitCode = await WebContainerProvider.spawnProcess(
                'npm',
                args,
                (chunk) => {
                  term.write(chunk.replace(/\n/g, '\r\n'));
                }
              );
              term.writeln(`\r\n\x1b[32m[Process Exited]\x1b[0m Code: ${exitCode}`);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              term.writeln(`\r\n\x1b[31m[WebContainer Fallback]\x1b[0m ${msg}`);
              // Fallback to in-browser compiler engine
              if (args[0] === 'install') {
                const pkg = currentProject.files['package.json'];
                await installPackages(pkg?.content);
              } else if (args.join(' ') === 'run dev') {
                startDevServer(currentProject.files);
              } else if (args.join(' ') === 'run build') {
                buildProject(currentProject.files);
              }
            }
          } else {
            // Standard browser fallback
            if (args[0] === 'install') {
              term.writeln('\r\n\x1b[33m[In-Browser Package Resolver]\x1b[0m Resolving manifest dependencies...');
              const pkg = currentProject?.files['package.json'];
              await installPackages(pkg?.content);
            } else if (args.join(' ') === 'run dev') {
              term.writeln('\r\n\x1b[36m[In-Browser Vite Compiler]\x1b[0m Dev server started on port 5173.');
              if (currentProject) startDevServer(currentProject.files);
            } else if (args.join(' ') === 'run build') {
              term.writeln('\r\n\x1b[36m[In-Browser TSX Compiler]\x1b[0m Building bundle...');
              if (currentProject) buildProject(currentProject.files);
            }
          }
          break;

        case 'git':
          if (args[0] === 'status') {
            term.writeln('\r\nOn branch main');
            if (gitStatus.unstaged.length === 0 && gitStatus.staged.length === 0) {
              term.writeln('nothing to commit, working tree clean');
            } else {
              term.writeln('\x1b[33mUnstaged changes:\x1b[0m');
              gitStatus.unstaged.forEach(u => term.writeln(`  modified:   ${u}`));
              if (gitStatus.staged.length > 0) {
                term.writeln('\x1b[32mStaged changes:\x1b[0m');
                gitStatus.staged.forEach(s => term.writeln(`  staged:     ${s}`));
              }
            }
          } else {
            term.writeln(`\r\n\x1b[33mgit ${args.join(' ')}\x1b[0m executed.`);
          }
          break;

        default:
          term.writeln(`\r\n\x1b[31mCommand not found: ${cmd}\x1b[0m. Type \x1b[33mhelp\x1b[0m for command list.`);
          break;
      }

      prompt();
    };

    const disposeData = term.onData((data) => {
      if (data === '\r') {
        handleCommand(currentLine);
        currentLine = '';
      } else if (data === '\u007F') {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data >= ' ' || data === '\t') {
        currentLine += data;
        term.write(data);
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      disposeData.dispose();
      term.dispose();
    };
  }, [activeProjectId, createFile, deleteFile, gitStatus, installPackages, buildProject, startDevServer, setWebContainerUrl]);

  return <div ref={terminalRef} className="w-full h-full min-h-[140px] overflow-hidden" />;
};

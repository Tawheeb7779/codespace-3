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
  const { setServerUrl, setPhase, addLog } = useRuntimeStore();

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      theme: {
        background: '#050507',
        foreground: '#e4e4e7',
        cursor: '#ef233c',
        selectionBackground: 'rgba(239, 35, 60, 0.35)',
        black: '#050507',
        red: '#ef233c',
        green: '#50fa7b',
        yellow: '#ffb786',
        blue: '#ef233c',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#e4e4e7',
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

    term.writeln('\x1b[31mCodeSpace 3D Red Noir Terminal & WASM Process Engine v1.0.0\x1b[0m');
    term.writeln('Type \x1b[33mhelp\x1b[0m for available filesystem & process commands.\r\n');

    let currentLine = '';

    const prompt = () => {
      term.write(`\r\n\x1b[31mcodespace@3d-ide\x1b[0m:\x1b[37m${currentPathRef.current}\x1b[0m$ `);
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
          term.writeln('  node <script>   - Execute Node.js process');
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
                term.writeln(`\x1b[31m${f.name}/\x1b[0m`);
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

        case 'node':
          if (!WebContainerProvider.isSupported()) {
            term.writeln(`\r\n\x1b[31m${WebContainerProvider.unsupportedReason()}\x1b[0m`);
          } else if (currentProject) {
            term.writeln(`\r\n\x1b[31m[WebContainer Process]\x1b[0m Spawning node ${args.join(' ')}...`);
            await RuntimeFilesystemBridge.initializeProject(currentProject.files);

            try {
              const exitCode = await WebContainerProvider.spawnProcess(
                'node',
                args,
                (chunk) => {
                  term.write(chunk.replace(/\n/g, '\r\n'));
                }
              );
              term.writeln(`\r\n\x1b[32m[Node Process Exited]\x1b[0m Exit Code: ${exitCode}`);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              term.writeln(`\r\n\x1b[31m[WebContainer Process Error]\x1b[0m ${msg}`);
            }
          }
          break;

        case 'npm':
          if (!WebContainerProvider.isSupported()) {
            term.writeln(`\r\n\x1b[31m${WebContainerProvider.unsupportedReason()}\x1b[0m`);
          } else if (currentProject) {
            term.writeln(`\r\n\x1b[31m[WebContainer Process]\x1b[0m Spawning npm ${args.join(' ')}...`);

            try {
              await RuntimeFilesystemBridge.initializeProject(currentProject.files);

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
              term.writeln(`\r\n\x1b[31m[WebContainer Process Error]\x1b[0m ${msg}`);
              addLog('error', `npm ${args.join(' ')}: ${msg}`);
            }
          }
          break;

        case 'git':
          if (args[0] === 'status') {
            term.writeln('\r\nOn branch main');
            if (gitStatus.unstaged.length === 0 && gitStatus.staged.length === 0) {
              term.writeln('nothing to commit, working tree clean');
            } else {
              term.writeln('\x1b[31mUnstaged changes:\x1b[0m');
              gitStatus.unstaged.forEach(u => term.writeln(`  modified:   ${u}`));
              if (gitStatus.staged.length > 0) {
                term.writeln('\x1b[32mStaged changes:\x1b[0m');
                gitStatus.staged.forEach(s => term.writeln(`  staged:     ${s}`));
              }
            }
          } else {
            term.writeln(`\r\n\x1b[31mgit ${args.join(' ')}\x1b[0m executed.`);
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

    // A dev server started from the terminal is a real server: report it to the runtime store.
    const disposeServerReady = WebContainerProvider.addServerReadyListener((url, port) => {
      setServerUrl(url, port);
      setPhase('running');
      term.writeln(`\r\n\x1b[32m[WebContainer Server Ready]\x1b[0m ${url}`);
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      disposeServerReady();
      disposeData.dispose();
      term.dispose();
    };
  }, [activeProjectId, createFile, deleteFile, gitStatus, addLog, setServerUrl, setPhase]);

  return <div ref={terminalRef} className="w-full h-full min-h-[140px] overflow-hidden bg-[#050507]" />;
};

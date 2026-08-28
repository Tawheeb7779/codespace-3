import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Play, Loader2 } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useRuntimeStore } from '../../runtime/RuntimeManager';
import { WebContainerProvider } from '../../runtime/WebContainerProvider';
import { RuntimeFilesystemBridge } from '../../runtime/RuntimeFilesystemBridge';
import { LocalShell } from '../../runtime/LocalShell';

const THEME = {
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
};

/**
 * `local` means the browser cannot run WebContainer at all. `ready` means it
 * can, but the container has not been booted yet - booting downloads several
 * megabytes, so it happens on demand rather than on every workspace open.
 */
type TerminalMode = 'ready' | 'starting' | 'webcontainer' | 'local' | 'error';

const MODE_LABEL: Record<TerminalMode, string> = {
  ready: 'Local shell - process execution not started',
  starting: 'Starting WebContainer shell...',
  webcontainer: 'WebContainer shell (real processes)',
  local: 'Local shell - no process execution',
  error: 'Shell error',
};

const MODE_TONE: Record<TerminalMode, string> = {
  ready: 'bg-surface-high text-outline border-outline-variant/20',
  starting: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  webcontainer: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  local: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  error: 'bg-red-500/15 text-red-300 border-red-500/30',
};

/**
 * Terminal surface.
 *
 * When the browser supports WebContainer, xterm is attached to a real `jsh`
 * process so every command is executed by the runtime. Otherwise it falls back
 * to a clearly-labelled local shell that manipulates the project tree and
 * refuses process commands rather than pretending they ran.
 */
export const Terminal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const startShellRef = useRef<(pendingCommand?: string) => void>(() => undefined);

  const [mode, setMode] = useState<TerminalMode>('ready');
  const [statusText, setStatusText] = useState<string | null>(null);

  const serverUrl = useRuntimeStore((s) => s.serverUrl);

  const handleStartClick = useCallback(() => {
    startShellRef.current();
  }, []);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return undefined;

    const term = new XTerm({
      theme: THEME,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
      scrollback: 5000,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    let disposed = false;
    let opened = false;
    let shellStarted = false;
    let shellProcess: Awaited<ReturnType<typeof WebContainerProvider.spawn>> | null = null;
    let writer: WritableStreamDefaultWriter<string> | null = null;
    let inputHandler: { dispose: () => void } | null = null;

    const safeFit = (): void => {
      if (disposed || !opened) return;
      try {
        fitAddon.fit();
      } catch {
        /* host is not laid out yet */
      }
    };

    const startWebContainerShell = async (pendingCommand?: string): Promise<void> => {
      term.writeln('');
      term.writeln('\x1b[36mBooting WebContainer runtime...\x1b[0m');

      const project = useProjectStore.getState().getActiveProject();
      if (!project) throw new Error('No active project to mount.');

      await RuntimeFilesystemBridge.mountProject(project.id, project.files);
      if (disposed) return;

      shellProcess = await WebContainerProvider.spawn('jsh', [], {
        terminal: { cols: term.cols, rows: term.rows },
      });
      if (disposed) {
        shellProcess.process.kill();
        return;
      }

      void shellProcess.process.output
        .pipeTo(new WritableStream({ write: (chunk) => term.write(chunk) }))
        .catch(() => undefined);

      writer = shellProcess.process.input.getWriter();
      inputHandler?.dispose();
      inputHandler = term.onData((data) => {
        void writer?.write(data);
      });

      setMode('webcontainer');
      setStatusText(null);

      if (pendingCommand) void writer.write(`${pendingCommand}\n`);

      void shellProcess.exit.then((code) => {
        if (disposed) return;
        term.writeln(`\r\n\x1b[33m[shell exited with code ${code}]\x1b[0m`);
        setMode('ready');
        shellStarted = false;
      });
    };

    const attachLocalShell = (reason: string, canEscalate: boolean): void => {
      const shell = new LocalShell({
        write: (text) => term.write(text),
        writeln: (text) => term.writeln(text),
        // Typing a process command in the on-demand state starts the real shell
        // and forwards the command, instead of refusing it.
        onProcessCommand: canEscalate
          ? (command) => {
              startShellRef.current(command);
              return true;
            }
          : undefined,
      });
      shell.printBanner(reason);
      inputHandler?.dispose();
      inputHandler = term.onData((data) => shell.handleInput(data));
    };

    const resizeObserver = new ResizeObserver(() => {
      safeFit();
      if (shellProcess) {
        try {
          shellProcess.process.resize({ cols: term.cols, rows: term.rows });
        } catch {
          /* process already gone */
        }
      }
    });

    startShellRef.current = (pendingCommand?: string): void => {
      if (disposed || shellStarted || WebContainerProvider.unsupportedReason()) return;
      shellStarted = true;
      setMode('starting');

      startWebContainerShell(pendingCommand).catch((e: unknown) => {
        if (disposed) return;
        const message = e instanceof Error ? e.message : String(e);
        term.writeln(`\r\n\x1b[31mWebContainer shell failed to start: ${message}\x1b[0m`);
        shellStarted = false;
        setStatusText(message);
        setMode('error');
        attachLocalShell(`WebContainer shell unavailable: ${message}`, true);
      });
    };

    // xterm schedules internal work the moment it is attached. Opening on the
    // next frame lets React's StrictMode mount/cleanup/mount cycle dispose an
    // unopened terminal instead of one with callbacks already in flight.
    const frame = requestAnimationFrame(() => {
      if (disposed) return;
      term.open(host);
      opened = true;
      safeFit();
      resizeObserver.observe(host);

      const unsupportedReason = WebContainerProvider.unsupportedReason();
      if (unsupportedReason) {
        setMode('local');
        setStatusText(unsupportedReason);
        attachLocalShell(unsupportedReason, false);
      } else {
        setMode('ready');
        attachLocalShell(
          'Process execution is available but not started. Run a command such as "npm install", or press Start shell.',
          true
        );
      }
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      inputHandler?.dispose();
      try {
        writer?.releaseLock();
      } catch {
        /* stream already closed */
      }
      shellProcess?.process.kill();
      try {
        term.dispose();
      } catch {
        /* already torn down */
      }
      startShellRef.current = () => undefined;
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col min-h-[140px]">
      <div className="flex items-center gap-2 px-1 pb-1 text-[10px] font-mono text-outline shrink-0">
        <span className={`px-1.5 py-0.5 rounded border shrink-0 ${MODE_TONE[mode]}`}>{MODE_LABEL[mode]}</span>

        {(mode === 'ready' || mode === 'error') && (
          <button
            onClick={handleStartClick}
            className="px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 flex items-center gap-1 shrink-0"
          >
            <Play className="w-2.5 h-2.5 fill-current" /> Start shell
          </button>
        )}
        {mode === 'starting' && <Loader2 className="w-3 h-3 animate-spin text-blue-300 shrink-0" />}

        {serverUrl && <span className="truncate text-emerald-400">{serverUrl}</span>}
        {statusText && (
          <span className="truncate text-outline/80" title={statusText}>
            {statusText}
          </span>
        )}
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden" />
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
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

type TerminalMode = 'connecting' | 'webcontainer' | 'local' | 'error';

/**
 * Terminal surface.
 *
 * When the browser supports WebContainer this attaches xterm directly to a real
 * `jsh` process, so every command (ls, cd, npm, node, git...) is executed by the
 * runtime rather than emulated. Otherwise it falls back to a clearly-labelled
 * local shell that can only manipulate the in-memory project tree - it never
 * pretends a process ran.
 */
export const Terminal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const [mode, setMode] = useState<TerminalMode>('connecting');
  const [errorText, setErrorText] = useState<string | null>(null);

  // Created once. The terminal must survive project edits, tab switches and
  // store updates - recreating it would wipe scrollback and the running shell.
  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

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
    term.open(host);

    termRef.current = term;
    fitRef.current = fitAddon;

    const safeFit = (): void => {
      try {
        fitAddon.fit();
      } catch {
        /* host not laid out yet */
      }
    };
    safeFit();

    let disposed = false;
    let shellProcess: Awaited<ReturnType<typeof WebContainerProvider.spawn>> | null = null;
    let writer: WritableStreamDefaultWriter<string> | null = null;
    const disposables: Array<{ dispose: () => void }> = [];

    const startWebContainerShell = async (): Promise<void> => {
      term.writeln('\x1b[36mCodeSpace 3D Terminal\x1b[0m - starting WebContainer shell...');

      const project = useProjectStore.getState().getActiveProject();
      if (!project) {
        term.writeln('\x1b[31mNo active project.\x1b[0m');
        setMode('error');
        return;
      }

      await RuntimeFilesystemBridge.mountProject(project.id, project.files);
      if (disposed) return;

      shellProcess = await WebContainerProvider.spawn('jsh', [], {
        terminal: { cols: term.cols, rows: term.rows },
      });
      if (disposed) {
        shellProcess.process.kill();
        return;
      }

      void shellProcess.process.output.pipeTo(
        new WritableStream({
          write: (chunk) => {
            term.write(chunk);
          },
        })
      ).catch(() => undefined);

      writer = shellProcess.process.input.getWriter();
      disposables.push(
        term.onData((data) => {
          void writer?.write(data);
        })
      );

      setMode('webcontainer');

      void shellProcess.exit.then((code) => {
        if (disposed) return;
        term.writeln(`\r\n\x1b[33m[shell exited with code ${code}]\x1b[0m`);
      });
    };

    const startLocalShell = (reason: string): void => {
      const shell = new LocalShell({
        write: (text) => term.write(text),
        writeln: (text) => term.writeln(text),
      });
      shell.printBanner(reason);
      disposables.push(term.onData((data) => shell.handleInput(data)));
      setMode('local');
      setErrorText(reason);
    };

    const unsupportedReason = WebContainerProvider.unsupportedReason();
    if (unsupportedReason) {
      startLocalShell(unsupportedReason);
    } else {
      startWebContainerShell().catch((e: unknown) => {
        if (disposed) return;
        const message = e instanceof Error ? e.message : String(e);
        term.writeln(`\r\n\x1b[31mWebContainer shell failed to start: ${message}\x1b[0m`);
        setErrorText(message);
        startLocalShell(`WebContainer shell unavailable: ${message}`);
        setMode('error');
      });
    }

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
    resizeObserver.observe(host);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      disposables.forEach((d) => d.dispose());
      try {
        writer?.releaseLock();
      } catch {
        /* ignore */
      }
      shellProcess?.process.kill();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, []);

  const serverUrl = useRuntimeStore((s) => s.serverUrl);

  return (
    <div className="w-full h-full flex flex-col min-h-[140px]">
      <div className="flex items-center gap-2 px-1 pb-1 text-[10px] font-mono text-outline shrink-0">
        <span
          className={`px-1.5 py-0.5 rounded border ${
            mode === 'webcontainer'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : mode === 'local'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : mode === 'error'
                  ? 'bg-red-500/15 text-red-300 border-red-500/30'
                  : 'bg-surface-high text-outline border-outline-variant/20'
          }`}
        >
          {mode === 'webcontainer'
            ? 'WebContainer shell (real processes)'
            : mode === 'local'
              ? 'Local shell - no process execution'
              : mode === 'error'
                ? 'Shell error'
                : 'Connecting...'}
        </span>
        {serverUrl && <span className="truncate text-emerald-400">{serverUrl}</span>}
        {mode !== 'webcontainer' && errorText && (
          <span className="truncate text-outline/80" title={errorText}>
            {errorText}
          </span>
        )}
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden" />
    </div>
  );
};

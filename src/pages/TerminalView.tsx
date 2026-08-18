import React, { useEffect, useRef } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Terminal as TermIcon, Play, Trash2, Cpu } from 'lucide-react';
import { useTerminalStore } from '../stores/useTerminalStore';

export const TerminalView: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const { history, executeCommand, clearHistory, workingDirectory } = useTerminalStore();
  const xtermRef = useRef<XTerminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      theme: {
        background: '#0e131d',
        foreground: '#dee2f1',
        cursor: '#3b82f6',
        selectionBackground: 'rgba(59, 130, 246, 0.3)',
        black: '#090e18',
        blue: '#3b82f6',
        cyan: '#06b6d4',
        green: '#10b981',
        magenta: '#a855f7',
        red: '#ef4444',
        white: '#dee2f1',
        yellow: '#f59e0b',
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;

    term.writeln('\x1b[1;34mCodeSpace 3D Spatial WASM Kernel [Node.js v22.22.1]\x1b[0m');
    term.writeln('Type \x1b[1;32m"help"\x1b[0m or \x1b[1;32m"npm run dev"\x1b[0m to test the sandbox CLI adapter.');
    term.write(`\r\n\x1b[1;36m${workingDirectory}\x1b[0m $ `);

    let currentInput = '';

    term.onData((data) => {
      const code = data.charCodeAt(0);
      if (code === 13) { // Enter
        term.write('\r\n');
        if (currentInput.trim()) {
          executeCommand(currentInput);
        }
        currentInput = '';
        term.write(`\x1b[1;36m${workingDirectory}\x1b[0m $ `);
      } else if (code === 127) { // Backspace
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code < 32) {
        // Ignore control characters
      } else {
        currentInput += data;
        term.write(data);
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [workingDirectory]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0e131d] overflow-hidden">
      {/* Terminal Header Bar */}
      <div className="h-10 bg-[#171c26]/90 border-b border-white/10 flex items-center justify-between px-4 select-none">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
          <TermIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">Interactive Terminal (WASM Sandbox)</span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
            Connected
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => executeCommand('npm run dev')}
            className="flex items-center space-x-1 text-xs font-mono bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded transition-colors"
          >
            <Play className="w-3 h-3 text-blue-400" />
            <span>npm run dev</span>
          </button>

          <button
            onClick={clearHistory}
            className="flex items-center space-x-1 text-xs font-mono bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 px-2.5 py-1 rounded transition-colors"
            title="Clear Terminal Output"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main Terminal DOM Area */}
      <div className="flex-1 p-3 overflow-hidden" ref={terminalRef} />

      {/* Bottom Command Output History Log Stream */}
      <div className="h-32 border-t border-white/10 bg-[#090e18]/80 p-3 font-mono text-xs overflow-y-auto space-y-1">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center space-x-1">
          <Cpu className="w-3 h-3 text-blue-400" />
          <span>Execution Stream Log ({history.length})</span>
        </div>
        {history.map((item) => (
          <div key={item.id} className="flex items-start space-x-2">
            <span className="text-[10px] text-slate-500 shrink-0">{item.timestamp}</span>
            <span className={
              item.type === 'error' ? 'text-rose-400 font-semibold' :
              item.type === 'success' ? 'text-emerald-400' :
              item.type === 'input' ? 'text-blue-400 font-bold' : 'text-slate-300'
            }>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

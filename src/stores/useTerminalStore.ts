import { create } from 'zustand';

export interface TerminalOutput {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'success';
  text: string;
  timestamp: string;
}

interface TerminalState {
  history: TerminalOutput[];
  currentCommand: string;
  isExecuting: boolean;
  workingDirectory: string;
  environmentVariables: Record<string, string>;
  executeCommand: (cmd: string) => void;
  clearHistory: () => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  history: [
    {
      id: 'init-1',
      type: 'system',
      text: 'CodeSpace 3D In-Browser Sandbox Kernel v3.4.0 [x86_64-wasm-emscripten]',
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 'init-2',
      type: 'system',
      text: 'Type "help", "npm run dev", "git status", or "node app.js" to execute commands.',
      timestamp: new Date().toLocaleTimeString()
    }
  ],
  currentCommand: '',
  isExecuting: false,
  workingDirectory: '~/codespace-3d-app',
  environmentVariables: {
    NODE_ENV: 'development',
    PORT: '3000'
  },

  clearHistory: () => set({ history: [] }),

  executeCommand: (fullCmd: string) => {
    const trimmed = fullCmd.trim();
    if (!trimmed) return;

    const time = new Date().toLocaleTimeString();
    const currentHist = get().history;

    const inputEntry: TerminalOutput = {
      id: Date.now().toString(),
      type: 'input',
      text: `${get().workingDirectory} $ ${trimmed}`,
      timestamp: time
    };

    set({ history: [...currentHist, inputEntry], isExecuting: true });

    setTimeout(() => {
      const parts = trimmed.split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);

      let responseOutputs: TerminalOutput[] = [];

      switch (cmd) {
        case 'help':
          responseOutputs = [
            {
              id: Date.now().toString() + '-1',
              type: 'output',
              text: 'Available Sandbox Commands:\n  help         - Show this help message\n  clear        - Clear terminal screen\n  ls           - List directory files\n  pwd          - Print working directory\n  node <file>  - Execute JS file in virtual runtime\n  npm <cmd>    - npm run dev | npm run build | npm install\n  pnpm <cmd>   - pnpm dev | pnpm install\n  git <cmd>    - git status | git branch | git commit | git log\n  env          - Show active environment parameters',
              timestamp: time
            }
          ];
          break;

        case 'clear':
          set({ history: [], isExecuting: false });
          return;

        case 'pwd':
          responseOutputs = [
            {
              id: Date.now().toString(),
              type: 'output',
              text: get().workingDirectory,
              timestamp: time
            }
          ];
          break;

        case 'ls':
          responseOutputs = [
            {
              id: Date.now().toString(),
              type: 'output',
              text: 'src/  public/  package.json  README.md  vite.config.ts  tsconfig.json',
              timestamp: time
            }
          ];
          break;

        case 'npm':
        case 'pnpm':
          if (args[0] === 'run' && args[1] === 'dev' || args[0] === 'dev') {
            responseOutputs = [
              {
                id: Date.now().toString() + '-1',
                type: 'success',
                text: 'VITE v6.1.1  ready in 210 ms\n\n  ➜  Local:   http://localhost:3000/\n  ➜  Network: http://192.168.1.42:3000/\n  ➜  press h + enter to show help',
                timestamp: time
              }
            ];
          } else if (args[0] === 'install' || args[0] === 'i') {
            responseOutputs = [
              {
                id: Date.now().toString(),
                type: 'success',
                text: `[${cmd.toUpperCase()}] Verified 212 packages, 0 vulnerabilities found. Sandbox sync complete.`,
                timestamp: time
              }
            ];
          } else {
            responseOutputs = [
              {
                id: Date.now().toString(),
                type: 'output',
                text: `Executing ${cmd} ${args.join(' ')}... Command finished with code 0.`,
                timestamp: time
              }
            ];
          }
          break;

        case 'git':
          if (args[0] === 'status') {
            responseOutputs = [
              {
                id: Date.now().toString(),
                type: 'output',
                text: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nChanges not staged for commit:\n  modified:   src/App.tsx\n\nno changes added to commit (use "git add" and/or "git commit")',
                timestamp: time
              }
            ];
          } else if (args[0] === 'branch') {
            responseOutputs = [
              {
                id: Date.now().toString(),
                type: 'output',
                text: '* main\n  feature/3d-canvas\n  fix/terminal-adapter',
                timestamp: time
              }
            ];
          } else {
            responseOutputs = [
              {
                id: Date.now().toString(),
                type: 'output',
                text: `[git] Executed: git ${args.join(' ')}`,
                timestamp: time
              }
            ];
          }
          break;

        case 'node':
          responseOutputs = [
            {
              id: Date.now().toString(),
              type: 'success',
              text: `[Node.js Virtual Kernel v22.22.1] Executing ${args[0] || 'index.js'}...\n> CodeSpace 3D Initialized successfully\nProcess exited with code 0.`,
              timestamp: time
            }
          ];
          break;

        case 'env':
          responseOutputs = [
            {
              id: Date.now().toString(),
              text: JSON.stringify(get().environmentVariables, null, 2),
              type: 'output',
              timestamp: time
            }
          ];
          break;

        default:
          responseOutputs = [
            {
              id: Date.now().toString(),
              type: 'error',
              text: `zsh: command not found: ${cmd}. Type 'help' for available sandbox commands.`,
              timestamp: time
            }
          ];
          break;
      }

      set({
        history: [...get().history, ...responseOutputs],
        isExecuting: false
      });
    }, 120);
  }
}));

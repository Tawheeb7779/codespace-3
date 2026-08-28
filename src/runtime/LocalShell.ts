import { useProjectStore } from '../store/useProjectStore';
import { ROOT_ID, joinPath, normalizePath, parentPath } from '../lib/paths';

interface ShellIO {
  write: (text: string) => void;
  writeln: (text: string) => void;
  /**
   * Called when the user runs a command that needs a real process. Return true
   * if the command was taken over (e.g. by starting the WebContainer shell);
   * returning false or omitting the handler makes the shell refuse it.
   */
  onProcessCommand?: (command: string) => boolean;
}

const CSI = String.fromCharCode(27) + '[';
const RESET = `${CSI}0m`;
const GREEN = `${CSI}32m`;
const BLUE = `${CSI}34m`;
const RED = `${CSI}31m`;
const YELLOW = `${CSI}33m`;
const CYAN = `${CSI}36m`;

/** Commands that would require a real process; refused rather than faked. */
const PROCESS_COMMANDS = new Set([
  'npm',
  'npx',
  'pnpm',
  'yarn',
  'node',
  'bun',
  'deno',
  'git',
  'tsc',
  'vite',
  'python',
  'python3',
  'curl',
  'wget',
]);

/**
 * Fallback shell used when WebContainer cannot run in this browser.
 *
 * It performs genuine operations on the in-memory project tree (cwd, ls, cd,
 * cat, mkdir, touch, rm) and explicitly refuses anything that would need a real
 * process, so no command ever reports a success that did not happen.
 */
export class LocalShell {
  private io: ShellIO;
  private cwd = ROOT_ID;
  private line = '';
  private cursor = 0;
  private history: string[] = [];
  private historyIndex = 0;
  private unsupportedReason = '';

  constructor(io: ShellIO) {
    this.io = io;
  }

  public printBanner(reason: string): void {
    this.unsupportedReason = reason;
    this.io.writeln(`${CYAN}CodeSpace 3D local shell${RESET}`);
    this.io.writeln(`${YELLOW}${reason}${RESET}`);
    this.io.writeln('File commands operate on the real project tree. Type "help" for the list.');
    this.prompt();
  }

  private prompt(): void {
    this.io.write(`\r\n${GREEN}codespace${RESET}:${BLUE}${this.cwd}${RESET}$ `);
  }

  private files(): Record<string, import('../types').ProjectFile> {
    return useProjectStore.getState().getActiveProject()?.files || {};
  }

  /** Resolves a user-supplied argument against the current working directory. */
  private resolve(arg: string): string {
    if (!arg || arg === '~') return ROOT_ID;
    return arg.startsWith('/') ? normalizePath(arg) : joinPath(this.cwd, arg);
  }

  public handleInput(data: string): void {
    for (let i = 0; i < data.length; i += 1) {
      const code = data.charCodeAt(i);

      // Escape sequences (arrow keys).
      if (code === 27 && data[i + 1] === '[') {
        const key = data[i + 2];
        i += 2;
        if (key === 'A') this.recallHistory(-1);
        else if (key === 'B') this.recallHistory(1);
        else if (key === 'C') this.moveCursor(1);
        else if (key === 'D') this.moveCursor(-1);
        continue;
      }

      const char = data[i];

      if (char === '\r' || char === '\n') {
        this.submit();
      } else if (code === 127 || code === 8) {
        this.backspace();
      } else if (code === 3) {
        this.io.write('^C');
        this.line = '';
        this.cursor = 0;
        this.prompt();
      } else if (code === 12) {
        this.io.write(`${CSI}2J${CSI}H`);
        this.line = '';
        this.cursor = 0;
        this.prompt();
      } else if (code >= 32) {
        this.insert(char);
      }
    }
  }

  private insert(char: string): void {
    this.line = this.line.slice(0, this.cursor) + char + this.line.slice(this.cursor);
    this.cursor += 1;
    this.redrawLine();
  }

  private backspace(): void {
    if (this.cursor === 0) return;
    this.line = this.line.slice(0, this.cursor - 1) + this.line.slice(this.cursor);
    this.cursor -= 1;
    this.redrawLine();
  }

  private moveCursor(delta: number): void {
    const next = this.cursor + delta;
    if (next < 0 || next > this.line.length) return;
    this.cursor = next;
    this.redrawLine();
  }

  private redrawLine(): void {
    // Rewrite the whole input line, then park the cursor at its logical position.
    this.io.write(`\r${CSI}K${GREEN}codespace${RESET}:${BLUE}${this.cwd}${RESET}$ ${this.line}`);
    const back = this.line.length - this.cursor;
    if (back > 0) this.io.write(`${CSI}${back}D`);
  }

  private recallHistory(delta: number): void {
    if (this.history.length === 0) return;
    const next = Math.min(this.history.length, Math.max(0, this.historyIndex + delta));
    this.historyIndex = next;
    this.line = next === this.history.length ? '' : this.history[next];
    this.cursor = this.line.length;
    this.redrawLine();
  }

  private submit(): void {
    const command = this.line.trim();
    this.line = '';
    this.cursor = 0;

    if (command) {
      this.history.push(command);
      this.historyIndex = this.history.length;
      this.io.writeln('');
      this.run(command);
    }

    this.prompt();
  }

  private run(input: string): void {
    const parts = input.split(/\s+/).filter(Boolean);
    const cmd = parts[0];
    const args = parts.slice(1);
    const store = useProjectStore.getState();
    const files = this.files();

    switch (cmd) {
      case 'help':
        this.io.writeln('File commands (operate on the real project tree):');
        this.io.writeln('  pwd                 print working directory');
        this.io.writeln('  ls [path]           list directory contents');
        this.io.writeln('  cd <path>           change working directory');
        this.io.writeln('  cat <file>          print file contents');
        this.io.writeln('  touch <file>        create an empty file');
        this.io.writeln('  mkdir <dir>         create a directory');
        this.io.writeln('  rm [-r] <path>      delete a file or directory');
        this.io.writeln('  open <file>         open a file in the editor');
        this.io.writeln('  echo <text>         print text');
        this.io.writeln('  clear               clear the screen');
        this.io.writeln('');
        this.io.writeln(
          this.io.onProcessCommand
            ? `${CYAN}Running npm, node or git starts the WebContainer shell, where they execute for real.${RESET}`
            : `${YELLOW}npm, node, git and other processes are NOT available here.${RESET}`
        );
        break;

      case 'clear':
        this.io.write(`${CSI}2J${CSI}H`);
        break;

      case 'pwd':
        this.io.writeln(this.cwd);
        break;

      case 'ls': {
        const target = this.resolve(args.find((a) => !a.startsWith('-')) || '.');
        const node = files[target];
        if (!node) {
          this.io.writeln(`${RED}ls: ${target}: No such file or directory${RESET}`);
          break;
        }
        if (!node.isFolder) {
          this.io.writeln(node.name);
          break;
        }
        const children = (node.children || []).map((id) => files[id]).filter(Boolean);
        if (children.length === 0) break;
        for (const child of children) {
          this.io.writeln(child.isFolder ? `${BLUE}${child.name}/${RESET}` : child.name);
        }
        break;
      }

      case 'cd': {
        const target = this.resolve(args[0] || '/');
        const node = files[target];
        if (!node) {
          this.io.writeln(`${RED}cd: ${target}: No such file or directory${RESET}`);
        } else if (!node.isFolder) {
          this.io.writeln(`${RED}cd: ${target}: Not a directory${RESET}`);
        } else {
          this.cwd = node.path;
        }
        break;
      }

      case 'cat': {
        if (!args[0]) {
          this.io.writeln('usage: cat <file>');
          break;
        }
        const node = files[this.resolve(args[0])];
        if (!node || node.isFolder) {
          this.io.writeln(`${RED}cat: ${args[0]}: No such file${RESET}`);
          break;
        }
        node.content.split('\n').forEach((l) => this.io.writeln(l));
        break;
      }

      case 'touch':
      case 'mkdir': {
        if (!args[0]) {
          this.io.writeln(`usage: ${cmd} <name>`);
          break;
        }
        const full = this.resolve(args[0]);
        const result = store.createFile(
          full.slice(full.lastIndexOf('/') + 1),
          parentPath(full),
          cmd === 'mkdir'
        );
        if (!result.ok) this.io.writeln(`${RED}${cmd}: ${result.error}${RESET}`);
        break;
      }

      case 'rm': {
        const path = args.find((a) => !a.startsWith('-'));
        if (!path) {
          this.io.writeln('usage: rm [-r] <path>');
          break;
        }
        const target = this.resolve(path);
        const node = files[target];
        if (!node) {
          this.io.writeln(`${RED}rm: ${path}: No such file or directory${RESET}`);
          break;
        }
        if (node.isFolder && !args.some((a) => a === '-r' || a === '-rf' || a === '-fr')) {
          this.io.writeln(`${RED}rm: ${path}: is a directory (use -r)${RESET}`);
          break;
        }
        const result = store.deleteFile(target);
        if (!result.ok) this.io.writeln(`${RED}rm: ${result.error}${RESET}`);
        break;
      }

      case 'open': {
        if (!args[0]) {
          this.io.writeln('usage: open <file>');
          break;
        }
        const target = this.resolve(args[0]);
        const node = files[target];
        if (!node || node.isFolder) {
          this.io.writeln(`${RED}open: ${args[0]}: No such file${RESET}`);
          break;
        }
        store.openFile(target);
        this.io.writeln(`Opened ${target} in the editor.`);
        break;
      }

      case 'echo':
        this.io.writeln(args.join(' '));
        break;

      default:
        if (PROCESS_COMMANDS.has(cmd)) {
          if (this.io.onProcessCommand?.(input)) {
            this.io.writeln(`${CYAN}Starting the WebContainer shell to run: ${input}${RESET}`);
            return;
          }
          this.io.writeln(
            `${YELLOW}${cmd}: not executed. This shell cannot run processes.${RESET}`
          );
          this.io.writeln(`${YELLOW}${this.unsupportedReason}${RESET}`);
        } else {
          this.io.writeln(`${RED}${cmd}: command not found${RESET}`);
        }
        break;
    }
  }
}

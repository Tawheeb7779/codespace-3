import { useProjectStore } from '../store/useProjectStore';
import { useRuntimeStore } from '../runtime/RuntimeManager';
import { ROOT_ID, normalizePath, parentPath, baseName, joinPath } from '../lib/paths';

/**
 * Turns the AI Assistant from a single-shot chatbot into a real coding agent: it can
 * inspect the active project, create/edit/delete/rename files, install dependencies,
 * run the project, and read back real errors - all against the same store/runtime the
 * rest of the IDE uses. No fake tool results: every tool either mutates real project
 * state or reports a real failure.
 */

export type AgentProvider = 'openai' | 'anthropic';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface ToolDef {
  name: string;
  description: string;
  parameters: { type: 'object'; properties: Record<string, unknown>; required: string[] };
}

const TOOLS: ToolDef[] = [
  {
    name: 'list_files',
    description: 'List every file and folder path in the active project (build artifacts excluded).',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'read_file',
    description: 'Read the content of one file by its absolute path.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string', description: 'e.g. /src/App.tsx' } },
      required: ['path'],
    },
  },
  {
    name: 'create_file',
    description: 'Create a new file with the given content, creating any missing parent folders.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description: 'Replace the full content of an existing file.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file or folder by path.',
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
  {
    name: 'rename_file',
    description: 'Rename a file or folder in place.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' }, newName: { type: 'string' } },
      required: ['path', 'newName'],
    },
  },
  {
    name: 'install_and_run',
    description:
      'Install dependencies (if needed) and start the real dev server for the active project. ' +
      'Use after file changes that need to be run or verified.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'run_build',
    description: "Run the project's real build script to completion and report the actual exit code/errors.",
    parameters: { type: 'object', properties: {}, required: [] },
  },
];

const MAX_TREE_ENTRIES = 300;
const MAX_FILE_CHARS = 4000;
const EXCLUDED_PREFIXES = ['/node_modules', '/dist', '/build', '/.git', '/.claude'];

function isExcludedPath(path: string): boolean {
  return EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Compact, token-efficient snapshot of the active project - never the whole repo. */
export function buildCompactContext(): string {
  const project = useProjectStore.getState().getActiveProject();
  if (!project) return 'No active project is open.';

  const files = Object.values(project.files).filter((f) => f.id !== ROOT_ID && !isExcludedPath(f.id));
  const tree = files
    .slice(0, MAX_TREE_ENTRIES)
    .map((f) => (f.isFolder ? `${f.id}/` : f.id))
    .join('\n');

  const pkg = project.files['/package.json']?.content;
  const activeFileId = useProjectStore.getState().activeFileId;
  const activeFile = activeFileId ? project.files[activeFileId] : null;
  const errors = useRuntimeStore.getState().errors.slice(-10);

  return [
    `Project: ${project.name}`,
    `File tree (${files.length}${files.length > MAX_TREE_ENTRIES ? `, showing first ${MAX_TREE_ENTRIES}` : ''}):\n${tree || '(empty)'}`,
    pkg ? `package.json:\n${pkg.slice(0, MAX_FILE_CHARS)}` : 'No package.json in this project yet.',
    activeFile && !activeFile.isFolder
      ? `Active file (${activeFile.path}):\n${activeFile.content.slice(0, MAX_FILE_CHARS)}`
      : 'No active file is open.',
    errors.length ? `Recent runtime errors:\n${errors.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

interface ToolResult {
  ok: boolean;
  [key: string]: unknown;
}

/** Creates any missing folders on the way to `filePath`, one path segment at a time. */
function ensureParentFolders(filePath: string): ToolResult {
  const segments = normalizePath(filePath).split('/').filter(Boolean);
  segments.pop();
  let current = ROOT_ID;
  for (const segment of segments) {
    const next = joinPath(current, segment);
    const project = useProjectStore.getState().getActiveProject();
    if (!project) return { ok: false, error: 'No active project.' };
    if (!project.files[next]) {
      const result = useProjectStore.getState().createFile(segment, current, true);
      if (!result.ok) return { ok: false, error: result.error };
    }
    current = next;
  }
  return { ok: true };
}

function toolListFiles(): ToolResult {
  const project = useProjectStore.getState().getActiveProject();
  if (!project) return { ok: false, error: 'No active project.' };
  const files = Object.values(project.files)
    .filter((f) => f.id !== ROOT_ID && !isExcludedPath(f.id))
    .slice(0, MAX_TREE_ENTRIES)
    .map((f) => (f.isFolder ? `${f.id}/` : f.id));
  return { ok: true, files };
}

function toolReadFile(path: string): ToolResult {
  const project = useProjectStore.getState().getActiveProject();
  if (!project) return { ok: false, error: 'No active project.' };
  const normalized = normalizePath(path);
  const file = project.files[normalized];
  if (!file || file.isFolder) return { ok: false, error: `File "${normalized}" not found.` };
  return { ok: true, content: file.content.slice(0, MAX_FILE_CHARS) };
}

function toolCreateFile(path: string, content: string): ToolResult {
  const store = useProjectStore.getState();
  const project = store.getActiveProject();
  if (!project) return { ok: false, error: 'No active project.' };
  const normalized = normalizePath(path);

  if (project.files[normalized] && !project.files[normalized].isFolder) {
    store.updateFileContent(normalized, content);
    store.saveFile(normalized);
    return { ok: true, path: normalized, note: 'File already existed; content was replaced.' };
  }

  const ensured = ensureParentFolders(normalized);
  if (!ensured.ok) return ensured;

  const result = store.createFile(baseName(normalized), parentPath(normalized), false);
  if (!result.ok) return { ok: false, error: result.error };
  store.updateFileContent(normalized, content);
  store.saveFile(normalized);
  return { ok: true, path: normalized };
}

function toolEditFile(path: string, content: string): ToolResult {
  const store = useProjectStore.getState();
  const project = store.getActiveProject();
  if (!project) return { ok: false, error: 'No active project.' };
  const normalized = normalizePath(path);
  if (!project.files[normalized]) {
    return { ok: false, error: `File "${normalized}" does not exist. Use create_file instead.` };
  }
  store.updateFileContent(normalized, content);
  store.saveFile(normalized);
  return { ok: true, path: normalized };
}

function toolDeleteFile(path: string): ToolResult {
  const result = useProjectStore.getState().deleteFile(normalizePath(path));
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

function toolRenameFile(path: string, newName: string): ToolResult {
  const result = useProjectStore.getState().renameFile(normalizePath(path), newName);
  return result.ok ? { ok: true, path: result.id } : { ok: false, error: result.error };
}

const INSTALL_RUN_TIMEOUT_MS = 45_000;

async function toolInstallAndRun(): Promise<ToolResult> {
  const project = useProjectStore.getState().getActiveProject();
  if (!project) return { ok: false, error: 'No active project.' };

  await useRuntimeStore.getState().startPreview(project.id, project.files);

  return new Promise<ToolResult>((resolve) => {
    let settled = false;
    const finish = (result: ToolResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve(result);
    };

    const check = (phase: string): boolean => {
      if (phase === 'running') {
        finish({ ok: true, phase, serverUrl: useRuntimeStore.getState().serverUrl });
        return true;
      }
      if (phase === 'failed' || phase === 'unsupported') {
        finish({ ok: false, phase, error: useRuntimeStore.getState().error || 'Dev server failed to start.' });
        return true;
      }
      return false;
    };

    const unsubscribe = useRuntimeStore.subscribe((state) => check(state.phase));
    const timer = setTimeout(
      () => finish({ ok: false, error: 'Timed out waiting for the dev server to become ready.' }),
      INSTALL_RUN_TIMEOUT_MS
    );

    check(useRuntimeStore.getState().phase);
  });
}

async function toolRunBuild(): Promise<ToolResult> {
  const project = useProjectStore.getState().getActiveProject();
  if (!project) return { ok: false, error: 'No active project.' };
  const result = await useRuntimeStore.getState().buildProject(project.id, project.files);
  return { ok: result.success, exitCode: result.exitCode, error: result.error, durationMs: result.durationMs };
}

async function executeTool(name: string, argsJson: string): Promise<{ result: ToolResult; label: string }> {
  let args: Record<string, string> = {};
  try {
    args = argsJson ? JSON.parse(argsJson) : {};
  } catch {
    return { result: { ok: false, error: 'Invalid tool arguments.' }, label: `${name} (invalid arguments)` };
  }

  switch (name) {
    case 'list_files':
      return { result: toolListFiles(), label: 'Listed project files' };
    case 'read_file':
      return { result: toolReadFile(args.path), label: `Read ${args.path}` };
    case 'create_file': {
      const result = toolCreateFile(args.path, args.content ?? '');
      return { result, label: result.ok ? `Created ${args.path}` : `Failed to create ${args.path}` };
    }
    case 'edit_file': {
      const result = toolEditFile(args.path, args.content ?? '');
      return { result, label: result.ok ? `Edited ${args.path}` : `Failed to edit ${args.path}` };
    }
    case 'delete_file': {
      const result = toolDeleteFile(args.path);
      return { result, label: result.ok ? `Deleted ${args.path}` : `Failed to delete ${args.path}` };
    }
    case 'rename_file': {
      const result = toolRenameFile(args.path, args.newName);
      return {
        result,
        label: result.ok ? `Renamed ${args.path} to ${args.newName}` : `Failed to rename ${args.path}`,
      };
    }
    case 'install_and_run': {
      const result = await toolInstallAndRun();
      return {
        result,
        label: result.ok ? 'Installed dependencies and started the dev server' : 'Dev server did not start',
      };
    }
    case 'run_build': {
      const result = await toolRunBuild();
      return { result, label: result.ok ? 'Build succeeded' : 'Build failed' };
    }
    default:
      return { result: { ok: false, error: `Unknown tool "${name}".` }, label: `Unknown tool "${name}"` };
  }
}

function combineSignal(outer: AbortSignal, timeoutMs: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const onOuterAbort = (): void => controller.abort();
  if (outer.aborted) controller.abort();
  outer.addEventListener('abort', onOuterAbort);
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer);
      outer.removeEventListener('abort', onOuterAbort);
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callOpenAI(apiKey: string, messages: any[], signal: AbortSignal): Promise<any> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      tools: TOOLS.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } })),
      tool_choice: 'auto',
    }),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new ApiError(errJson.error?.message || `OpenAI API error ${res.status}`, res.status);
  }
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callAnthropic(apiKey: string, system: string, messages: any[], signal: AbortSignal): Promise<any> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 1500,
      system,
      messages,
      tools: TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters })),
    }),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new ApiError(errJson.error?.message || `Anthropic API error ${res.status}`, res.status);
  }
  return res.json();
}

const MAX_AGENT_STEPS = 8;
const TURN_TIMEOUT_MS = 30_000;

export interface AgentLoopParams {
  provider: AgentProvider;
  apiKey: string;
  userText: string;
  /** Fires once per tool call with a short human-readable label. */
  onStep: (label: string) => void;
  signal: AbortSignal;
}

export interface AgentLoopResult {
  finalText: string;
}

/**
 * Runs the agent to completion: plan -> tool calls -> observe results -> repeat, up to
 * MAX_AGENT_STEPS turns, stopping early if the same tool fails twice in a row. Each call
 * is a fresh conversation - the active project's real, current state (not chat history)
 * is what carries context between follow-up instructions.
 */
export async function runAgentLoop({ provider, apiKey, userText, onStep, signal }: AgentLoopParams): Promise<AgentLoopResult> {
  const systemPrompt =
    'You are a coding agent inside the CodeSpace 3D browser IDE. You can inspect and modify the ' +
    'active project with the tools provided. Prefer inspecting before creating; keep existing files ' +
    'unless asked to remove them; install and run the project after changes that need to execute; ' +
    'check for real errors before declaring success. Reply at the end with a short, concrete summary ' +
    'of what you did - no filler.\n\n' +
    buildCompactContext();

  let consecutiveFailures = 0;
  let lastFailedTool: string | null = null;

  const recordOutcome = (toolName: string, ok: boolean): boolean => {
    if (ok) {
      consecutiveFailures = 0;
      lastFailedTool = null;
      return false;
    }
    consecutiveFailures = toolName === lastFailedTool ? consecutiveFailures + 1 : 1;
    lastFailedTool = toolName;
    return consecutiveFailures >= 2;
  };

  if (provider === 'openai') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText },
    ];
    for (let step = 0; step < MAX_AGENT_STEPS; step++) {
      const { signal: turnSignal, clear } = combineSignal(signal, TURN_TIMEOUT_MS);
      let data;
      try {
        data = await callOpenAI(apiKey, messages, turnSignal);
      } finally {
        clear();
      }
      const message = data.choices?.[0]?.message;
      const toolCalls = message?.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        return { finalText: message?.content || 'Done.' };
      }
      messages.push({ role: 'assistant', content: message.content ?? null, tool_calls: toolCalls });
      let shouldStop = false;
      for (const call of toolCalls) {
        const { result, label } = await executeTool(call.function.name, call.function.arguments);
        onStep(label);
        if (recordOutcome(call.function.name, result.ok)) shouldStop = true;
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
      if (shouldStop) {
        return { finalText: `Stopped after "${lastFailedTool}" failed twice in a row - check the error above.` };
      }
    }
    return { finalText: 'Stopped after reaching the step limit. Send a follow-up to continue.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [{ role: 'user', content: userText }];
  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    const { signal: turnSignal, clear } = combineSignal(signal, TURN_TIMEOUT_MS);
    let data;
    try {
      data = await callAnthropic(apiKey, systemPrompt, messages, turnSignal);
    } finally {
      clear();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = data.content || [];
    const toolUses = content.filter((b) => b.type === 'tool_use');
    if (toolUses.length === 0) {
      const text = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
      return { finalText: text || 'Done.' };
    }
    messages.push({ role: 'assistant', content });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultBlocks: any[] = [];
    let shouldStop = false;
    for (const use of toolUses) {
      const { result, label } = await executeTool(use.name, JSON.stringify(use.input || {}));
      onStep(label);
      if (recordOutcome(use.name, result.ok)) shouldStop = true;
      resultBlocks.push({ type: 'tool_result', tool_use_id: use.id, content: JSON.stringify(result) });
    }
    messages.push({ role: 'user', content: resultBlocks });
    if (shouldStop) {
      return { finalText: `Stopped after "${lastFailedTool}" failed twice in a row - check the error above.` };
    }
  }
  return { finalText: 'Stopped after reaching the step limit. Send a follow-up to continue.' };
}

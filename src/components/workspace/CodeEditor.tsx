import React, { Component, ErrorInfo, ReactNode, useCallback, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { X, FileCode, FileText, FileJson, Save, AlertTriangle, RefreshCw } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { usePreferenceStore } from '../../store/usePreferenceStore';

/** Keeps a Monaco failure from taking down the whole workspace. */
class EditorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[CodeEditor] Monaco crashed:', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-3 text-xs p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <p className="text-slate-200 font-medium">The code editor failed to load.</p>
          <p className="text-outline max-w-md">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-3 py-1.5 bg-primary-container text-white rounded font-medium flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload editor
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function tabIcon(fileName: string): ReactNode {
  const ext = fileName.split('.').pop();
  if (ext === 'tsx' || ext === 'ts' || ext === 'js' || ext === 'jsx' || ext === 'mjs') {
    return <FileCode className="w-3.5 h-3.5 text-primary" />;
  }
  if (ext === 'json') return <FileJson className="w-3.5 h-3.5 text-tertiary" />;
  return <FileText className="w-3.5 h-3.5 text-slate-400" />;
}

const EditorSurface: React.FC = () => {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const activeFileId = useProjectStore((s) => s.activeFileId);
  const openTabIds = useProjectStore((s) => s.openTabIds);
  const openFile = useProjectStore((s) => s.openFile);
  const closeTab = useProjectStore((s) => s.closeTab);
  const updateFileContent = useProjectStore((s) => s.updateFileContent);
  const saveFile = useProjectStore((s) => s.saveFile);

  const fontSize = usePreferenceStore((s) => s.fontSize);
  const wordWrap = usePreferenceStore((s) => s.wordWrap);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const currentProject = projects.find((p) => p.id === activeProjectId);
  const activeFile = currentProject && activeFileId ? currentProject.files[activeFileId] : null;

  const handleMount: OnMount = useCallback(
    (editorInstance, monaco) => {
      editorRef.current = editorInstance;

      monaco.editor.defineTheme('codespace-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
          { token: 'string', foreground: 'f1fa8c' },
          { token: 'number', foreground: 'bd93f9' },
          { token: 'type', foreground: '8be9fd' },
          { token: 'function', foreground: '50fa7b' },
        ],
        colors: {
          'editor.background': '#0e131d',
          'editor.foreground': '#f8f8f2',
          'editor.lineHighlightBackground': '#1b202a',
          'editorCursor.foreground': '#adc6ff',
          'editorWhitespace.foreground': '#424754',
          'editorIndentGuide.background': '#252a35',
          'editorIndentGuide.activeBackground': '#4d8eff',
        },
      });
      monaco.editor.setTheme('codespace-dark');

      // JSX in .tsx/.jsx models should not be reported as a syntax error.
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        jsx: monaco.languages.typescript.JsxEmit.React,
        allowJs: true,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        esModuleInterop: true,
      });
      // Module resolution against a virtual workspace produces noise, not signal.
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });

      editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const id = useProjectStore.getState().activeFileId;
        if (id) useProjectStore.getState().saveFile(id);
      });
    },
    []
  );

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-outline">
        No project selected.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0e131d] overflow-hidden">
      <div className="flex bg-surface-low border-b border-outline-variant/15 overflow-x-auto select-none">
        {openTabIds.map((tabId) => {
          const tabFile = currentProject.files[tabId];
          if (!tabFile) return null;
          const isTabActive = tabId === activeFileId;

          return (
            <div
              key={tabId}
              onClick={() => openFile(tabId)}
              title={tabFile.path}
              className={`flex items-center gap-2 px-3 py-2 text-xs border-r border-outline-variant/10 cursor-pointer min-w-[120px] max-w-[220px] group transition-colors ${
                isTabActive
                  ? 'bg-[#0e131d] border-t-2 border-t-primary text-white font-medium'
                  : 'bg-surface-low/50 text-outline hover:bg-surface-high hover:text-slate-200 border-t-2 border-t-transparent'
              }`}
            >
              {tabIcon(tabFile.name)}
              <span className="truncate flex-1">{tabFile.name}</span>
              {tabFile.isUnsaved && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tabId);
                }}
                className="p-0.5 text-outline hover:text-red-400 rounded hover:bg-surface-high opacity-0 group-hover:opacity-100 transition-all"
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {activeFile && (
        <div className="h-6 px-3 flex items-center justify-between bg-surface-low/60 border-b border-outline-variant/10 text-[10px] font-mono text-outline">
          <span className="truncate">{activeFile.path}</span>
          <button
            onClick={() => saveFile(activeFile.id)}
            disabled={!activeFile.isUnsaved}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface-high disabled:opacity-40 transition-colors"
            title="Save (Ctrl/Cmd+S)"
          >
            <Save className="w-3 h-3" />
            {activeFile.isUnsaved ? 'Unsaved' : 'Saved'}
          </button>
        </div>
      )}

      <div className="flex-1 relative min-h-0">
        {activeFile ? (
          <Editor
            height="100%"
            // A distinct model per path keeps undo history and view state per file.
            path={`${currentProject.id}${activeFile.path}`}
            defaultLanguage={activeFile.language || 'plaintext'}
            language={activeFile.language || 'plaintext'}
            value={activeFile.content}
            onChange={(value) => {
              if (value !== undefined) updateFileContent(activeFile.id, value);
            }}
            onMount={handleMount}
            options={{
              fontSize: fontSize || 14,
              fontFamily: "'JetBrains Mono', monospace",
              wordWrap: wordWrap ? 'on' : 'off',
              minimap: { enabled: true, scale: 0.75 },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              tabSize: 2,
            }}
            loading={
              <div className="h-full flex items-center justify-center text-xs text-primary font-mono gap-2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading editor...
              </div>
            }
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-outline gap-3">
            <FileCode className="w-12 h-12 opacity-40" />
            <p className="text-sm">Select a file from the explorer or the 3D graph to start editing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const CodeEditor: React.FC = () => (
  <EditorBoundary>
    <EditorSurface />
  </EditorBoundary>
);

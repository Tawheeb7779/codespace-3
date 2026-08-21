import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { X, FileCode, FileText, FileJson } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { usePreferenceStore } from '../../store/usePreferenceStore';

export const CodeEditor: React.FC = () => {
  const {
    projects,
    activeProjectId,
    activeFileId,
    openTabIds,
    openFile,
    closeTab,
    saveFile,
    updateFileContent
  } = useProjectStore();

  const { fontSize, wordWrap } = usePreferenceStore();

  const currentProject = projects.find((p) => p.id === activeProjectId);
  if (!currentProject) return null;

  const activeFile = activeFileId ? currentProject.files[activeFileId] : null;

  const handleEditorMount: OnMount = (editor, monaco) => {
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

    // Register Save Command (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const activeId = useProjectStore.getState().activeFileId;
      if (activeId) {
        saveFile(activeId);
      }
    });
  };

  const getTabIcon = (fileName: string) => {
    const ext = fileName.split('.').pop();
    if (ext === 'tsx' || ext === 'ts' || ext === 'js' || ext === 'jsx') {
      return <FileCode className="w-3.5 h-3.5 text-primary" />;
    }
    if (ext === 'json') {
      return <FileJson className="w-3.5 h-3.5 text-tertiary" />;
    }
    return <FileText className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="h-full flex flex-col bg-[#0e131d] overflow-hidden">
      {/* Editor Tab Bar */}
      <div className="flex bg-surface-low border-b border-outline-variant/15 overflow-x-auto select-none">
        {openTabIds.map((tabId) => {
          const tabFile = currentProject.files[tabId];
          if (!tabFile) return null;
          const isTabActive = tabId === activeFileId;

          return (
            <div
              key={tabId}
              onClick={() => openFile(tabId)}
              className={`flex items-center gap-2 px-3 py-2 text-xs border-r border-outline-variant/10 cursor-pointer min-w-[120px] max-w-[200px] group transition-colors ${
                isTabActive
                  ? 'bg-[#0e131d] border-t-2 border-t-primary text-white font-medium'
                  : 'bg-surface-low/50 text-outline hover:bg-surface-high hover:text-slate-200 border-t-2 border-t-transparent'
              }`}
            >
              {getTabIcon(tabFile.name)}
              <span className="truncate flex-1">{tabFile.name}</span>
              {tabFile.isUnsaved ? (
                <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
              ) : null}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tabId);
                }}
                className="p-0.5 text-outline hover:text-red-400 rounded hover:bg-surface-high opacity-0 group-hover:opacity-100 transition-all"
                title="Close Tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative">
        {activeFile ? (
          <Editor
            height="100%"
            language={activeFile.language || 'typescript'}
            value={activeFile.content}
            onChange={(value) => {
              if (value !== undefined) {
                updateFileContent(activeFile.id, value);
              }
            }}
            onMount={handleEditorMount}
            options={{
              fontSize: fontSize || 14,
              fontFamily: "'JetBrains Mono', monospace",
              wordWrap: wordWrap ? 'on' : 'off',
              minimap: { enabled: true, scale: 0.75 },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              tabSize: 2,
            }}
            loading={
              <div className="h-full flex items-center justify-center text-xs text-primary font-mono gap-2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading Monaco Editor...
              </div>
            }
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-outline gap-3">
            <FileCode className="w-12 h-12 opacity-40" />
            <p className="text-sm">Select a file from the explorer or 3D graph to start editing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

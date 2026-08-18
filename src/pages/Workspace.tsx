import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Folder,
  FolderOpen,
  FileCode,
  Plus,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  Terminal as TermIcon,
  Play,
  Code2
} from 'lucide-react';
import { useWorkspaceStore, FileItem } from '../stores/useWorkspaceStore';
import { useNavigate } from 'react-router-dom';

export const WorkspaceView: React.FC = () => {
  const navigate = useNavigate();
  const {
    files,
    activeFileId,
    openFileIds,
    openFile,
    closeFile,
    setActiveFile,
    updateFileContent,
    createFile,
    deleteFile,
    getFileById
  } = useWorkspaceStore();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '1': true,
    '2': true
  });
  const [newFileName, setNewFileName] = useState('');
  const [creatingInParent, setCreatingInParent] = useState<string | null>(null);
  const [isFolder, setIsFolder] = useState(false);

  const activeFile = activeFileId ? getFileById(activeFileId) : null;

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    createFile(creatingInParent, newFileName.trim(), isFolder);
    setNewFileName('');
    setCreatingInParent(null);
  };

  const renderFileTree = (items: FileItem[]) => {
    return items.map((item) => {
      if (item.type === 'folder') {
        const isExpanded = !!expandedFolders[item.id];
        return (
          <div key={item.id} className="select-none">
            <div className="flex items-center justify-between px-2 py-1 text-slate-300 hover:text-white hover:bg-white/5 rounded cursor-pointer group text-xs font-mono">
              <div
                className="flex items-center space-x-1.5 flex-1 truncate"
                onClick={() => toggleFolder(item.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                )}
                <span className="truncate">{item.name}</span>
              </div>

              <div className="hidden group-hover:flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingInParent(item.id);
                    setIsFolder(false);
                    setExpandedFolders(p => ({ ...p, [item.id]: true }));
                  }}
                  className="p-0.5 text-slate-400 hover:text-blue-400"
                  title="New File"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(item.id);
                  }}
                  className="p-0.5 text-slate-400 hover:text-rose-400"
                  title="Delete Folder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isExpanded && item.children && (
              <div className="pl-3.5 border-l border-white/10 ml-2 space-y-0.5 my-0.5">
                {renderFileTree(item.children)}
              </div>
            )}
          </div>
        );
      }

      const isActive = item.id === activeFileId;
      return (
        <div
          key={item.id}
          className={`flex items-center justify-between px-2 py-1 text-xs font-mono rounded cursor-pointer group select-none ${
            isActive
              ? 'bg-blue-600/30 text-blue-300 font-medium border border-blue-500/30'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          onClick={() => openFile(item.id)}
        >
          <div className="flex items-center space-x-1.5 truncate">
            <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
            <span className="truncate">{item.name}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteFile(item.id);
            }}
            className="hidden group-hover:block p-0.5 text-slate-400 hover:text-rose-400"
            title="Delete File"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* File Explorer Sidebar Panel */}
      <div className="w-64 bg-[#121620]/90 border-r border-white/10 flex flex-col h-full shrink-0">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span>Workspace</span>
          </span>
          <button
            onClick={() => {
              setCreatingInParent(null);
              setIsFolder(false);
            }}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
            title="New Root File"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tree Container */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {renderFileTree(files)}

          {/* New file creation modal/input inline */}
          {creatingInParent !== undefined && (
            <form onSubmit={handleCreateSubmit} className="mt-2 p-2 bg-white/5 border border-blue-500/40 rounded-lg">
              <div className="text-[10px] text-blue-400 font-mono mb-1">
                New {isFolder ? 'Folder' : 'File'} in {creatingInParent ? 'directory' : 'root'}
              </div>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={isFolder ? 'folder-name' : 'filename.tsx'}
                className="w-full bg-[#0e131d] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => setIsFolder(!isFolder)}
                  className="text-slate-400 hover:text-slate-200 underline"
                >
                  Switch to {isFolder ? 'File' : 'Folder'}
                </button>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setCreatingInParent(null)}
                    className="px-2 py-0.5 bg-white/10 rounded text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                  >
                    Create
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Code Editor Main Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0e131d]">
        {/* Editor Tabs */}
        <div className="flex items-center bg-[#171c26]/80 border-b border-white/10 overflow-x-auto select-none">
          {openFileIds.map((id) => {
            const file = getFileById(id);
            if (!file) return null;
            const isActive = id === activeFileId;

            return (
              <div
                key={id}
                onClick={() => setActiveFile(id)}
                className={`flex items-center space-x-2 px-3 py-2 text-xs font-mono border-r border-white/10 cursor-pointer shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#0e131d] text-blue-400 border-t-2 border-t-blue-500 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(id);
                  }}
                  className="hover:text-rose-400 p-0.5 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <div className="flex-1 border-b border-white/10" />

          <div className="flex items-center space-x-2 px-3">
            <button
              onClick={() => navigate('/preview')}
              className="flex items-center space-x-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded border border-cyan-500/30 transition-all"
            >
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              onClick={() => navigate('/terminal')}
              className="flex items-center space-x-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded border border-emerald-500/30 transition-all"
            >
              <TermIcon className="w-3 h-3" />
              <span className="hidden sm:inline">Terminal</span>
            </button>
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div className="flex-1 relative">
          {activeFile ? (
            <Editor
              height="100%"
              language={activeFile.language || 'typescript'}
              theme="vs-dark"
              value={activeFile.content || ''}
              onChange={(value) => updateFileContent(activeFile.id, value || '')}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                fontFamily: 'JetBrains Mono',
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                padding: { top: 12 },
                automaticLayout: true
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-sm">
              <Code2 className="w-12 h-12 text-slate-600 mb-3" />
              <span>Select or create a file to start editing</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

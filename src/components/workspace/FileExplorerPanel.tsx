import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Trash2,
  Edit3,
  Search,
  Check,
  X
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface FileTreeItemProps {
  fileId: string;
  depth?: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ fileId, depth = 0 }) => {
  const {
    projects,
    activeProjectId,
    activeFileId,
    openFile,
    deleteFile,
    renameFile,
    createFile
  } = useProjectStore();

  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isNewFolder, setIsNewFolder] = useState(false);

  const currentProject = projects.find((p) => p.id === activeProjectId);
  if (!currentProject) return null;

  const file = currentProject.files[fileId];
  if (!file) return null;

  const getFileIcon = (fileName: string, isFolder?: boolean) => {
    if (isFolder) {
      return isOpen ? <FolderOpen className="w-4 h-4 text-amber-400" /> : <Folder className="w-4 h-4 text-amber-400" />;
    }
    const ext = fileName.split('.').pop();
    if (ext === 'tsx' || ext === 'ts' || ext === 'js' || ext === 'jsx') {
      return <FileCode className="w-4 h-4 text-primary" />;
    }
    if (ext === 'json') {
      return <FileJson className="w-4 h-4 text-tertiary" />;
    }
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameValue.trim() && renameValue !== file.name) {
      renameFile(fileId, renameValue.trim());
    }
    setIsEditing(false);
  };

  const handleCreateChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      createFile(newFileName.trim(), fileId, isNewFolder);
      setNewFileName('');
      setShowNewFileInput(false);
    }
  };

  const isActive = activeFileId === fileId;

  return (
    <div>
      <div
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={`group flex items-center justify-between py-1 pr-2 rounded text-xs cursor-pointer select-none transition-colors ${
          isActive ? 'bg-primary-container/20 text-white font-medium' : 'hover:bg-surface-high text-slate-300 hover:text-white'
        }`}
        onClick={() => {
          if (file.isFolder) {
            setIsOpen(!isOpen);
          } else {
            openFile(fileId);
          }
        }}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {file.isFolder ? (
            <span className="text-outline">
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
          ) : (
            <span className="w-3.5" />
          )}

          {getFileIcon(file.name, file.isFolder)}

          {isEditing ? (
            <form onSubmit={handleRenameSubmit} className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="px-1 py-0.5 bg-surface-container border border-primary text-xs text-white rounded w-full focus:outline-none"
              />
              <button type="submit" className="p-0.5 text-emerald-400"><Check className="w-3 h-3" /></button>
              <button type="button" onClick={() => setIsEditing(false)} className="p-0.5 text-slate-400"><X className="w-3 h-3" /></button>
            </form>
          ) : (
            <span className="truncate flex-1">{file.name}</span>
          )}

          {file.isUnsaved && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1" title="Unsaved changes" />}
        </div>

        {/* Action icons on hover */}
        {!isEditing && (
          <div className="hidden group-hover:flex items-center gap-1 opacity-80" onClick={(e) => e.stopPropagation()}>
            {file.isFolder && (
              <>
                <button
                  onClick={() => {
                    setShowNewFileInput(true);
                    setIsNewFolder(false);
                    setIsOpen(true);
                  }}
                  className="p-1 text-outline hover:text-primary rounded hover:bg-surface-container"
                  title="New File"
                >
                  <FilePlus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setShowNewFileInput(true);
                    setIsNewFolder(true);
                    setIsOpen(true);
                  }}
                  className="p-1 text-outline hover:text-amber-400 rounded hover:bg-surface-container"
                  title="New Folder"
                >
                  <FolderPlus className="w-3 h-3" />
                </button>
              </>
            )}
            <button
              onClick={() => {
                setRenameValue(file.name);
                setIsEditing(true);
              }}
              className="p-1 text-outline hover:text-white rounded hover:bg-surface-container"
              title="Rename"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={() => deleteFile(fileId)}
              className="p-1 text-outline hover:text-red-400 rounded hover:bg-surface-container"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Input for adding new file inside this folder */}
      {showNewFileInput && (
        <form
          onSubmit={handleCreateChildSubmit}
          className="flex items-center gap-1 py-1 pr-2"
          style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
        >
          {isNewFolder ? <Folder className="w-3.5 h-3.5 text-amber-400" /> : <FileCode className="w-3.5 h-3.5 text-primary" />}
          <input
            type="text"
            autoFocus
            placeholder={isNewFolder ? 'folder-name' : 'file-name.tsx'}
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="px-1.5 py-0.5 bg-surface-container border border-primary-container text-xs text-white rounded flex-1 focus:outline-none"
          />
          <button type="submit" className="p-0.5 text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => setShowNewFileInput(false)} className="p-0.5 text-slate-400"><X className="w-3.5 h-3.5" /></button>
        </form>
      )}

      {/* Render children if folder */}
      {file.isFolder && isOpen && file.children && (
        <div>
          {file.children.map((childId) => (
            <FileTreeItem key={childId} fileId={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorerPanel: React.FC = () => {
  const { projects, activeProjectId, createFile } = useProjectStore();
  const [filterText, setFilterText] = useState('');
  const [showRootInput, setShowRootInput] = useState(false);
  const [rootFileName, setRootFileName] = useState('');
  const [isRootFolder, setIsRootFolder] = useState(false);

  const currentProject = projects.find((p) => p.id === activeProjectId);
  if (!currentProject) return <div className="p-4 text-xs text-outline">No project selected.</div>;

  const handleCreateRootSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rootFileName.trim()) {
      createFile(rootFileName.trim(), 'root', isRootFolder);
      setRootFileName('');
      setShowRootInput(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface-low text-xs select-none border-r border-outline-variant/15">
      {/* Explorer Header */}
      <div className="p-3 border-b border-outline-variant/15 flex items-center justify-between">
        <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px]">EXPLORER</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowRootInput(true);
              setIsRootFolder(false);
            }}
            className="p-1 hover:text-white text-outline rounded hover:bg-surface-high transition-colors"
            title="New Root File"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setShowRootInput(true);
              setIsRootFolder(true);
            }}
            className="p-1 hover:text-white text-outline rounded hover:bg-surface-high transition-colors"
            title="New Root Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter search */}
      <div className="px-3 py-2 border-b border-outline-variant/10">
        <div className="relative">
          <Search className="w-3 h-3 text-outline absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter files..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-7 pr-2 py-1 bg-surface-container border border-outline-variant/15 rounded text-[11px] text-white focus:outline-none focus:border-primary-container"
          />
        </div>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {showRootInput && (
          <form onSubmit={handleCreateRootSubmit} className="flex items-center gap-1 py-1 pr-2 pl-2">
            {isRootFolder ? <Folder className="w-3.5 h-3.5 text-amber-400" /> : <FileCode className="w-3.5 h-3.5 text-primary" />}
            <input
              type="text"
              autoFocus
              placeholder={isRootFolder ? 'folder-name' : 'file-name.ts'}
              value={rootFileName}
              onChange={(e) => setRootFileName(e.target.value)}
              className="px-1.5 py-0.5 bg-surface-container border border-primary-container text-xs text-white rounded flex-1 focus:outline-none"
            />
            <button type="submit" className="p-0.5 text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => setShowRootInput(false)} className="p-0.5 text-slate-400"><X className="w-3.5 h-3.5" /></button>
          </form>
        )}

        {currentProject.rootFileIds
          .filter((id) => {
            if (!filterText) return true;
            return id.toLowerCase().includes(filterText.toLowerCase());
          })
          .map((fileId) => (
            <FileTreeItem key={fileId} fileId={fileId} depth={0} />
          ))}
      </div>
    </div>
  );
};

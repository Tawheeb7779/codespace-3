import React, { useMemo, useState } from 'react';
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
  X,
  AlertTriangle,
} from 'lucide-react';
import { useProjectStore, FileOperationResult } from '../../store/useProjectStore';
import { ROOT_ID } from '../../lib/paths';
import { ProjectFile } from '../../types';

function fileIcon(fileName: string): React.ReactNode {
  const ext = fileName.split('.').pop();
  if (ext === 'tsx' || ext === 'ts' || ext === 'js' || ext === 'jsx' || ext === 'mjs') {
    return <FileCode className="w-4 h-4 text-primary" />;
  }
  if (ext === 'json') return <FileJson className="w-4 h-4 text-tertiary" />;
  return <FileText className="w-4 h-4 text-slate-400" />;
}

interface FileTreeItemProps {
  fileId: string;
  depth?: number;
  onError: (message: string) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ fileId, depth = 0, onError }) => {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const activeFileId = useProjectStore((s) => s.activeFileId);
  const openFile = useProjectStore((s) => s.openFile);
  const deleteFile = useProjectStore((s) => s.deleteFile);
  const renameFile = useProjectStore((s) => s.renameFile);
  const createFile = useProjectStore((s) => s.createFile);

  const [isOpen, setIsOpen] = useState(depth < 1);
  const [isEditing, setIsEditing] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [isNewFolder, setIsNewFolder] = useState(false);

  const currentProject = projects.find((p) => p.id === activeProjectId);
  const file = currentProject?.files[fileId];
  if (!currentProject || !file) return null;

  const report = (result: FileOperationResult): void => {
    if (!result.ok && result.error) onError(result.error);
  };

  const handleRenameSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (renameValue.trim() && renameValue.trim() !== file.name) {
      report(renameFile(fileId, renameValue.trim()));
    }
    setIsEditing(false);
  };

  const handleCreateSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!newName.trim()) return;
    const result = createFile(newName.trim(), fileId, isNewFolder);
    report(result);
    if (result.ok) {
      setNewName('');
      setShowNewInput(false);
    }
  };

  const handleDelete = (): void => {
    const childCount = file.isFolder ? (file.children || []).length : 0;
    if (childCount > 0 && !window.confirm(`Delete "${file.name}" and its ${childCount} item(s)?`)) {
      return;
    }
    report(deleteFile(fileId));
  };

  const isActive = activeFileId === fileId;

  return (
    <div>
      <div
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={`group flex items-center justify-between py-1 pr-2 rounded text-xs cursor-pointer select-none transition-colors ${
          isActive ? 'bg-primary-container/20 text-white font-medium' : 'hover:bg-surface-high text-slate-300 hover:text-white'
        }`}
        onClick={() => (file.isFolder ? setIsOpen(!isOpen) : openFile(fileId))}
        title={file.path}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {file.isFolder ? (
            <span className="text-outline">
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
          ) : (
            <span className="w-3.5" />
          )}

          {file.isFolder ? (
            isOpen ? (
              <FolderOpen className="w-4 h-4 text-amber-400" />
            ) : (
              <Folder className="w-4 h-4 text-amber-400" />
            )
          ) : (
            fileIcon(file.name)
          )}

          {isEditing ? (
            <form onSubmit={handleRenameSubmit} className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="px-1 py-0.5 bg-surface-container border border-primary text-xs text-white rounded w-full focus:outline-none"
              />
              <button type="submit" className="p-0.5 text-emerald-400" title="Confirm rename">
                <Check className="w-3 h-3" />
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="p-0.5 text-slate-400">
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <span className="truncate flex-1">{file.name}</span>
          )}

          {file.isUnsaved && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1" title="Unsaved changes" />}
        </div>

        {!isEditing && (
          <div className="hidden group-hover:flex items-center gap-1 opacity-80" onClick={(e) => e.stopPropagation()}>
            {file.isFolder && (
              <>
                <button
                  onClick={() => {
                    setShowNewInput(true);
                    setIsNewFolder(false);
                    setIsOpen(true);
                  }}
                  className="p-1 text-outline hover:text-primary rounded hover:bg-surface-container"
                  title="New file"
                >
                  <FilePlus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setShowNewInput(true);
                    setIsNewFolder(true);
                    setIsOpen(true);
                  }}
                  className="p-1 text-outline hover:text-amber-400 rounded hover:bg-surface-container"
                  title="New folder"
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
              onClick={handleDelete}
              className="p-1 text-outline hover:text-red-400 rounded hover:bg-surface-container"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {showNewInput && (
        <form
          onSubmit={handleCreateSubmit}
          className="flex items-center gap-1 py-1 pr-2"
          style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
        >
          {isNewFolder ? <Folder className="w-3.5 h-3.5 text-amber-400" /> : <FileCode className="w-3.5 h-3.5 text-primary" />}
          <input
            type="text"
            autoFocus
            placeholder={isNewFolder ? 'folder-name' : 'file-name.tsx'}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowNewInput(false);
            }}
            className="px-1.5 py-0.5 bg-surface-container border border-primary-container text-xs text-white rounded flex-1 focus:outline-none"
          />
          <button type="submit" className="p-0.5 text-emerald-400" title="Create">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setShowNewInput(false)} className="p-0.5 text-slate-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {file.isFolder && isOpen && (file.children || []).map((childId) => (
        <FileTreeItem key={childId} fileId={childId} depth={depth + 1} onError={onError} />
      ))}
    </div>
  );
};

export const FileExplorerPanel: React.FC = () => {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const createFile = useProjectStore((s) => s.createFile);
  const openFile = useProjectStore((s) => s.openFile);

  const [filterText, setFilterText] = useState('');
  const [showRootInput, setShowRootInput] = useState(false);
  const [rootName, setRootName] = useState('');
  const [isRootFolder, setIsRootFolder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === activeProjectId);

  const matches = useMemo<ProjectFile[]>(() => {
    if (!currentProject || !filterText.trim()) return [];
    const needle = filterText.trim().toLowerCase();
    return Object.values(currentProject.files)
      .filter((f) => !f.isFolder && f.path.toLowerCase().includes(needle))
      .sort((a, b) => a.path.localeCompare(b.path))
      .slice(0, 200);
  }, [currentProject, filterText]);

  if (!currentProject) return <div className="p-4 text-xs text-outline">No project selected.</div>;

  const rootChildren = currentProject.files[ROOT_ID]?.children || [];

  const handleCreateRoot = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!rootName.trim()) return;
    const result = createFile(rootName.trim(), ROOT_ID, isRootFolder);
    if (!result.ok) {
      setError(result.error || 'Unable to create item.');
      return;
    }
    setError(null);
    setRootName('');
    setShowRootInput(false);
  };

  return (
    <div className="h-full flex flex-col bg-surface-low text-xs select-none border-r border-outline-variant/15">
      <div className="p-3 border-b border-outline-variant/15 flex items-center justify-between">
        <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px]">EXPLORER</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowRootInput(true);
              setIsRootFolder(false);
            }}
            className="p-1 hover:text-white text-outline rounded hover:bg-surface-high transition-colors"
            title="New root file"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setShowRootInput(true);
              setIsRootFolder(true);
            }}
            className="p-1 hover:text-white text-outline rounded hover:bg-surface-high transition-colors"
            title="New root folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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

      {error && (
        <div className="mx-2 mt-2 px-2 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {showRootInput && (
          <form onSubmit={handleCreateRoot} className="flex items-center gap-1 py-1 pr-2 pl-2">
            {isRootFolder ? <Folder className="w-3.5 h-3.5 text-amber-400" /> : <FileCode className="w-3.5 h-3.5 text-primary" />}
            <input
              type="text"
              autoFocus
              placeholder={isRootFolder ? 'folder-name' : 'file-name.ts'}
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowRootInput(false);
              }}
              className="px-1.5 py-0.5 bg-surface-container border border-primary-container text-xs text-white rounded flex-1 focus:outline-none"
            />
            <button type="submit" className="p-0.5 text-emerald-400" title="Create">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setShowRootInput(false)} className="p-0.5 text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {filterText.trim() ? (
          matches.length === 0 ? (
            <div className="text-outline px-2 py-3 text-[11px]">No files match "{filterText}".</div>
          ) : (
            matches.map((f) => (
              <button
                key={f.id}
                onClick={() => openFile(f.id)}
                className="w-full flex items-center gap-1.5 py-1 px-2 rounded text-left hover:bg-surface-high text-slate-300 hover:text-white"
                title={f.path}
              >
                {fileIcon(f.name)}
                <span className="truncate">{f.name}</span>
                <span className="truncate text-[10px] text-outline ml-auto">{f.path}</span>
              </button>
            ))
          )
        ) : (
          rootChildren.map((fileId) => (
            <FileTreeItem key={fileId} fileId={fileId} depth={0} onError={setError} />
          ))
        )}
      </div>
    </div>
  );
};

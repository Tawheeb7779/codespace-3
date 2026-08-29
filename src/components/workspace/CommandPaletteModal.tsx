import React, { useState, useEffect } from 'react';
import { Search, FileCode, Play, Sparkles, FolderTree, Terminal as TerminalIcon, X } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: 'code' | '3d' | 'preview' | 'split') => void;
  toggleAi: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectView,
  toggleAi,
}) => {
  const { projects, activeProjectId, openFile } = useProjectStore();
  const [query, setQuery] = useState('');

  const currentProject = projects.find((p) => p.id === activeProjectId);

  // Ctrl/Cmd+K toggling lives in the workspace so a single listener owns it;
  // two listeners raced and left the palette permanently open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  const fileItems = currentProject
    ? Object.values(currentProject.files).filter((f) => !f.isFolder)
    : [];

  const filteredFiles = fileItems
    .filter((f) => f.path.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 60);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 p-4">
      <div className="glass-panel w-full max-w-xl rounded-2xl overflow-hidden border border-outline-variant/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Search Header */}
        <div className="p-3 border-b border-outline-variant/15 flex items-center gap-3 bg-surface-container">
          <Search className="w-4 h-4 text-primary shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search workspace files... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-outline focus:outline-none"
          />
          <button onClick={onClose} className="p-1 hover:text-white text-outline rounded hover:bg-surface-high">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command & File Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3 text-xs select-none">
          {/* Quick Actions */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] text-outline font-semibold uppercase tracking-wider">COMMANDS</span>
            <div
              onClick={() => {
                onSelectView('split');
                onClose();
              }}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-high cursor-pointer text-slate-200 hover:text-white transition-colors"
            >
              <FolderTree className="w-4 h-4 text-primary" />
              <span>Switch View: Split 3D Workspace</span>
            </div>
            <div
              onClick={() => {
                onSelectView('preview');
                onClose();
              }}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-high cursor-pointer text-slate-200 hover:text-white transition-colors"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Run Live Preview Runner</span>
            </div>
            <div
              onClick={() => {
                toggleAi();
                onClose();
              }}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-high cursor-pointer text-slate-200 hover:text-white transition-colors"
            >
              <Sparkles className="w-4 h-4 text-secondary" />
              <span>Open AI Coding Assistant Drawer</span>
            </div>
          </div>

          {/* Files Search */}
          <div className="space-y-1 pt-2 border-t border-outline-variant/10">
            <span className="px-2 text-[10px] text-outline font-semibold uppercase tracking-wider">
              FILES ({filteredFiles.length})
            </span>
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => {
                  openFile(file.id);
                  onClose();
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-high cursor-pointer text-slate-200 hover:text-white transition-colors font-mono"
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-primary" />
                  <span>{file.name}</span>
                </div>
                <span className="text-[10px] text-outline">{file.path}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-surface-container border-t border-outline-variant/15 flex items-center justify-between text-[10px] text-outline">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-surface-high border border-outline-variant/20 font-mono">⌘K</kbd> Toggle Palette</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-surface-high border border-outline-variant/20 font-mono">↵</kbd> Select</span>
          </div>
          <span className="flex items-center gap-1"><TerminalIcon className="w-3 h-3 text-primary" /> CodeSpace 3D Engine</span>
        </div>
      </div>
    </div>
  );
};

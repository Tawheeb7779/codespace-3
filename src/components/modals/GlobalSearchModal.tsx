import React, { useState, useEffect } from 'react';
import { Search, FileCode, ArrowRight, X } from 'lucide-react';
import { useWorkspaceStore, FileItem } from '../../stores/useWorkspaceStore';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { files, openFile } = useWorkspaceStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getAllFiles = (items: FileItem[]): FileItem[] => {
    let result: FileItem[] = [];
    for (const item of items) {
      if (item.type === 'file') result.push(item);
      if (item.children) result = result.concat(getAllFiles(item.children));
    }
    return result;
  };

  const allFiles = getAllFiles(files);
  const filteredFiles = query.trim()
    ? allFiles.filter(f => f.name.toLowerCase().includes(query.toLowerCase()) || f.path.toLowerCase().includes(query.toLowerCase()))
    : allFiles;

  const handleSelectFile = (fileId: string) => {
    openFile(fileId);
    navigate('/workspace');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-[#171c26]/95 border border-white/15 rounded-xl shadow-2xl overflow-hidden glass-panel">
        <div className="flex items-center px-4 py-3 border-b border-white/10 space-x-3">
          <Search className="w-5 h-5 text-blue-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files, components, settings... (ESC to exit)"
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none text-sm font-sans"
            autoFocus
          />
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-1 font-mono text-xs">
          <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Workspace Files ({filteredFiles.length})
          </div>
          {filteredFiles.length === 0 ? (
            <div className="p-4 text-center text-slate-400 italic">No matching files found.</div>
          ) : (
            filteredFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => handleSelectFile(file.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-600/20 text-slate-200 hover:text-white group transition-colors"
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-slate-100">{file.name}</span>
                  <span className="text-slate-500 truncate text-[11px]">{file.path}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

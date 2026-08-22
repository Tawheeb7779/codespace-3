import React from 'react';
import { useWorkspaceStore, FileItem } from '../../stores/useWorkspaceStore';
import { FileCode, Folder, ChevronRight } from 'lucide-react';

export const SpatialFileGraph: React.FC = () => {
  const { files, activeFileId, openFile } = useWorkspaceStore();

  const renderNodes = (items: FileItem[], depth = 0) => {
    return items.map((item) => {
      const isActive = item.id === activeFileId;
      return (
        <div key={item.id} style={{ marginLeft: `${depth * 16}px` }} className="my-1 font-mono text-xs">
          {item.type === 'folder' ? (
            <div className="flex items-center space-x-2 text-blue-400 font-bold bg-blue-900/20 border border-blue-500/20 px-3 py-1.5 rounded-lg">
              <Folder className="w-4 h-4" />
              <span>{item.name}/</span>
            </div>
          ) : (
            <button
              onClick={() => openFile(item.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all ${
                isActive
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 font-bold shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>{item.name}</span>
            </button>
          )}

          {item.children && <div className="mt-1">{renderNodes(item.children, depth + 1)}</div>}
        </div>
      );
    });
  };

  return (
    <div className="p-4 bg-[#171c26]/80 border border-white/10 rounded-xl backdrop-blur-md space-y-3">
      <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
        <ChevronRight className="w-4 h-4 text-blue-400" />
        <span>3D Spatial Workspace Graph Mapping</span>
      </div>

      <div className="p-3 bg-[#0e131d] rounded-lg border border-white/10 max-h-60 overflow-y-auto">
        {renderNodes(files)}
      </div>
    </div>
  );
};

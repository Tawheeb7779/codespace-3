import React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { X, GitCommit, ArrowLeft } from 'lucide-react';

interface MonacoDiffEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalCode: string;
  modifiedCode: string;
  filePath: string;
  language?: string;
}

export const MonacoDiffEditorModal: React.FC<MonacoDiffEditorModalProps> = ({
  isOpen,
  onClose,
  originalCode,
  modifiedCode,
  filePath,
  language = 'typescript'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[85vh] bg-[#171c26] border border-white/15 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 bg-[#0e131d] border-b border-white/10 flex items-center justify-between px-4 font-mono text-xs select-none">
          <div className="flex items-center space-x-2 text-slate-200">
            <GitCommit className="w-4 h-4 text-amber-400" />
            <span className="font-bold">Monaco Diff Viewer:</span>
            <span className="text-amber-400">{filePath}</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
              Original vs Modified
            </span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Diff Editor Container */}
        <div className="flex-1 relative bg-[#0e131d]">
          <DiffEditor
            height="100%"
            language={language}
            theme="vs-dark"
            original={originalCode}
            modified={modifiedCode}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono',
              renderSideBySide: true,
              automaticLayout: true
            }}
          />
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Plus,
  Minus,
  FileCode,
  Send,
  History,
  Eye
} from 'lucide-react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { MonacoDiffEditorModal } from '../components/modals/MonacoDiffEditorModal';

export const SourceControl: React.FC = () => {
  const { activeBranch, branches, setActiveBranch, files, getFileById } = useWorkspaceStore();
  const [stagedFiles, setStagedFiles] = useState<string[]>(['src/App.tsx']);
  const [unstagedFiles, setUnstagedFiles] = useState<string[]>(['src/index.css', 'README.md']);
  const [commitMessage, setCommitMessage] = useState('');
  const [commits, setCommits] = useState([
    { id: '8a91f42', msg: 'feat: add WebGL particle shader grid', author: 'Tawheeb', time: '10 mins ago' },
    { id: '3c19e01', msg: 'fix: resolve WASM terminal resize fit glitch', author: 'Tawheeb', time: '2 hours ago' },
    { id: 'f72a110', msg: 'chore: initial CodeSpace 3D workspace setup', author: 'Tawheeb', time: '1 day ago' },
  ]);

  const [diffFile, setDiffFile] = useState<{ path: string; orig: string; mod: string } | null>(null);

  const stageFile = (file: string) => {
    setUnstagedFiles(unstagedFiles.filter(f => f !== file));
    setStagedFiles([...stagedFiles, file]);
  };

  const unstageFile = (file: string) => {
    setStagedFiles(stagedFiles.filter(f => f !== file));
    setUnstagedFiles([...unstagedFiles, file]);
  };

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim() || stagedFiles.length === 0) return;

    const newCommit = {
      id: Math.random().toString(16).substring(2, 9),
      msg: commitMessage,
      author: 'Tawheeb',
      time: 'Just now'
    };

    setCommits([newCommit, ...commits]);
    setStagedFiles([]);
    setCommitMessage('');
  };

  const openDiff = (filePath: string) => {
    const orig = `// Original Git HEAD state\nexport default function App() {\n  return <div>Original App Component</div>;\n}`;
    const mod = `// Current modified working tree\nexport default function App() {\n  return (\n    <div className="p-6 text-cyan-400 bg-slate-900 min-h-screen">\n      <h1 className="text-3xl font-bold">Welcome to CodeSpace 3D IDE</h1>\n    </div>\n  );\n}`;
    setDiffFile({ path: filePath, orig, mod });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 select-none">
      {/* Top Source Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <GitBranch className="w-6 h-6 text-amber-400" />
            <span>Source Control & Differential Manager</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Local Workspace Git State & Line-by-Line Monaco Diff Editor
          </p>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
            <span className="text-slate-400">Branch:</span>
            <select
              value={activeBranch}
              onChange={(e) => setActiveBranch(e.target.value)}
              className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
            >
              {branches.map(b => (
                <option key={b} value={b} className="bg-[#171c26] text-slate-200">{b}</option>
              ))}
            </select>
          </div>

          <button className="flex items-center space-x-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors">
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Create PR</span>
          </button>
        </div>
      </div>

      {/* Main Git Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Changes & Staging */}
        <div className="lg:col-span-2 space-y-6">
          {/* Commit Message Box */}
          <form onSubmit={handleCommit} className="bg-[#171c26]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="font-semibold flex items-center space-x-1.5">
                <GitCommit className="w-4 h-4 text-amber-400" />
                <span>New Commit</span>
              </span>
              <span className="text-slate-400">{stagedFiles.length} files staged</span>
            </div>

            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message (e.g., feat: add glassmorphic modal)"
              rows={2}
              className="w-full bg-[#0e131d] border border-white/10 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!commitMessage.trim() || stagedFiles.length === 0}
                className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-medium px-4 py-2 rounded-lg text-xs transition-all shadow-lg shadow-amber-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Commit to {activeBranch}</span>
              </button>
            </div>
          </form>

          {/* Staged Changes List */}
          <div className="bg-[#171c26]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-300 border-b border-white/10 pb-2">
              <span className="font-semibold text-emerald-400">Staged Changes ({stagedFiles.length})</span>
            </div>

            {stagedFiles.length === 0 ? (
              <div className="text-slate-500 text-xs italic py-2">No staged changes.</div>
            ) : (
              stagedFiles.map((file) => (
                <div key={file} className="flex items-center justify-between p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-200">{file}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openDiff(file)}
                      className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-amber-400"
                      title="View Monaco Diff"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => unstageFile(file)}
                      className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-rose-400"
                      title="Unstage file"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Unstaged Changes List */}
          <div className="bg-[#171c26]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-300 border-b border-white/10 pb-2">
              <span className="font-semibold text-amber-400">Modified Changes ({unstagedFiles.length})</span>
            </div>

            {unstagedFiles.length === 0 ? (
              <div className="text-slate-500 text-xs italic py-2">Working tree clean.</div>
            ) : (
              unstagedFiles.map((file) => (
                <div key={file} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-200">{file}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openDiff(file)}
                      className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-amber-400"
                      title="View Monaco Diff"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => stageFile(file)}
                      className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-emerald-400"
                      title="Stage file"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Commit History */}
        <div className="bg-[#171c26]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md space-y-4 font-mono text-xs">
          <div className="flex items-center space-x-2 text-slate-200 font-semibold border-b border-white/10 pb-2">
            <History className="w-4 h-4 text-amber-400" />
            <span>Commit History ({commits.length})</span>
          </div>

          <div className="space-y-3">
            {commits.map((c) => (
              <div key={c.id} className="p-3 bg-white/5 rounded-lg border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold">{c.id}</span>
                  <span className="text-slate-500 text-[10px]">{c.time}</span>
                </div>
                <div className="text-slate-200 font-sans font-medium">{c.msg}</div>
                <div className="text-[10px] text-slate-400">by {c.author}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {diffFile && (
        <MonacoDiffEditorModal
          isOpen={!!diffFile}
          onClose={() => setDiffFile(null)}
          filePath={diffFile.path}
          originalCode={diffFile.orig}
          modifiedCode={diffFile.mod}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Github,
  GitFork,
  Star,
  Download,
  ExternalLink,
  Search,
  CheckCircle,
  XCircle,
  FolderGit2
} from 'lucide-react';
import { useIntegrationsStore } from '../stores/useIntegrationsStore';

export const GitHubView: React.FC = () => {
  const { githubConnected, githubUser, connectGithub, disconnectGithub } = useIntegrationsStore();
  const [usernameInput, setUsernameInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const sampleRepos = [
    { name: 'codespace-3', desc: 'CodeSpace 3D Web IDE reference repository', stars: 124, forks: 18, lang: 'TypeScript', visibility: 'Public' },
    { name: 'threejs-[#0e131d]-canvas', desc: 'Spatial WebGL shader engine for dark glass UI', stars: 89, forks: 7, lang: 'GLSL / JS', visibility: 'Public' },
    { name: 'nexus-ai-agents', desc: 'WASM AI context orchestrator', stars: 310, forks: 42, lang: 'Rust / WASM', visibility: 'Private' },
  ];

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    connectGithub(usernameInput.trim());
    setUsernameInput('');
  };

  const filteredRepos = sampleRepos.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Github className="w-6 h-6 text-white" />
            <span>GitHub Developer Architecture</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Connect repositories, import workspace state, and commit directly to GitHub
          </p>
        </div>

        {githubConnected ? (
          <div className="flex items-center space-x-3 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-mono text-xs text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>Connected as @{githubUser}</span>
            <button
              onClick={disconnectGithub}
              className="text-rose-400 hover:underline ml-2"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="flex items-center space-x-2 font-mono text-xs">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="GitHub username"
              className="bg-[#171c26] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Connect
            </button>
          </form>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-[#171c26]/70 p-3 rounded-xl border border-white/10">
          <div className="flex items-center space-x-2 bg-[#0e131d] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 w-64">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter repositories..."
              className="bg-transparent focus:outline-none w-full text-slate-100"
            />
          </div>

          <button className="flex items-center space-x-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs px-3 py-1.5 rounded-lg border border-white/10">
            <FolderGit2 className="w-4 h-4 text-blue-400" />
            <span>Sync Repositories</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
          {filteredRepos.map((repo, idx) => (
            <div key={idx} className="bg-[#171c26]/70 border border-white/10 hover:border-blue-500/30 rounded-xl p-5 backdrop-blur-md space-y-3 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-blue-400 flex items-center space-x-1.5">
                    <Github className="w-3.5 h-3.5 text-slate-300" />
                    <span>{repo.name}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-slate-300">{repo.visibility}</span>
                </div>
                <p className="text-xs text-slate-300 mt-2">{repo.desc}</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-3 text-slate-400">
                  <span className="flex items-center space-x-1"><Star className="w-3 h-3 text-amber-400" /> {repo.stars}</span>
                  <span className="flex items-center space-x-1"><GitFork className="w-3 h-3 text-slate-400" /> {repo.forks}</span>
                </div>

                <button className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded border border-blue-500/20 transition-colors">
                  <Download className="w-3 h-3" />
                  <span>Import</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

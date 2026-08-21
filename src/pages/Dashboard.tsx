import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderPlus,
  Github,
  Settings,
  Boxes,
  Code2,
  Sparkles,
  Search,
  Trash2,
  Plus,
  Cpu,
  Globe,
  ExternalLink,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Server
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { usePreferenceStore } from '../store/usePreferenceStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects, createProject, deleteProject, setActiveProject, githubConnected, setGithubConnected, setGithubRepo } = useProjectStore();
  const { render3DQuality, setRender3DQuality, enable3DWorkspace, setEnable3DWorkspace, aiProvider, setAiProvider, aiApiKey, setAiApiKey } = usePreferenceStore();

  const [activeTab, setActiveTab] = useState<'projects' | 'github' | 'settings' | 'integrations'>('projects');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectTemplate, setNewProjectTemplate] = useState<'react-three' | 'vanilla'>('react-three');
  const [searchTerm, setSearchTerm] = useState('');

  // GitHub import state
  const [githubTokenInput, setGithubTokenInput] = useState('');
  const [repoSearchInput, setRepoSearchInput] = useState('');
  const [importingRepo, setImportingRepo] = useState(false);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const project = createProject(newProjectName, newProjectDesc, newProjectTemplate);
    setShowCreateModal(false);
    setNewProjectName('');
    setNewProjectDesc('');
    navigate(`/workspace/${project.id}`);
  };

  const handleOpenProject = (id: string) => {
    setActiveProject(id);
    navigate(`/workspace/${id}`);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050507] text-[#e4e4e7] flex flex-col font-sans selection:bg-[#ef233c]/30 selection:text-white">
      {/* Background Grids & Red Ambient Lights */}
      <div className="fixed inset-0 bg-grid-pattern opacity-15 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[300px] bg-[#ef233c]/10 blur-[130px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-white/10 glass-panel px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ef233c] to-[#8d0801] flex items-center justify-center text-white shadow-red-glow-sm">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg tracking-wider text-white flex items-center gap-2">
              CODESPACE <span className="text-[#ef233c]">3D</span>
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-[#ef233c]/20 text-[#ef233c] border border-[#ef233c]/40 uppercase">
                COMMAND CENTER
              </span>
            </span>
            <p className="text-[10px] font-mono text-zinc-500">PROD SPATIAL IDE & CLOUD ISOLATES</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-[#121215] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'projects' ? 'bg-[#ef233c] text-white shadow-red-glow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" /> Projects
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'github' ? 'bg-[#ef233c] text-white shadow-red-glow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" /> GitHub
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'integrations' ? 'bg-[#ef233c] text-white shadow-red-glow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Integrations
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'settings' ? 'bg-[#ef233c] text-white shadow-red-glow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
        </nav>
      </header>

      {/* Main Command Center Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Status Dashboard Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Active Workspaces</div>
              <div className="font-display text-2xl font-bold text-white mt-0.5">{projects.length}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#ef233c]/10 border border-[#ef233c]/30 text-[#ef233c]">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">WASM Isolate Engine</div>
              <div className="font-display text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> ONLINE
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">GitHub REST Bridge</div>
              <div className="font-display text-base font-bold text-white mt-1">
                {githubConnected ? <span className="text-emerald-400">CONNECTED</span> : <span className="text-zinc-400">STANDBY</span>}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white">
              <Github className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">3D WebGL Profile</div>
              <div className="font-display text-base font-bold text-[#ef233c] uppercase mt-1">
                {render3DQuality} QUALITY
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#ef233c]/10 border border-[#ef233c]/30 text-[#ef233c]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search projects by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#121215] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#ef233c]/50 transition-all"
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-[#ef233c] hover:bg-[#d90429] text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-red-glow-sm"
              >
                <Plus className="w-4 h-4" /> Create Red Noir Workspace
              </button>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="glass-panel-interactive rounded-2xl p-6 flex flex-col justify-between group relative cursor-pointer border border-white/10"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#0e0e11] border border-white/10 text-[#ef233c] group-hover:border-[#ef233c]/40 transition-colors">
                          <Code2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-white group-hover:text-[#ef233c] transition-colors flex items-center gap-2">
                            {project.name}
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h3>
                          <span className="text-[10px] font-mono text-zinc-500">
                            ID: {project.id}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-[#ef233c] hover:bg-[#ef233c]/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {project.description || 'No description provided for this 3D workspace.'}
                    </p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1.5 text-[#ef233c]">
                      <Sparkles className="w-3.5 h-3.5" /> {project.template}
                    </span>
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}

              {filteredProjects.length === 0 && (
                <div className="col-span-full py-20 text-center glass-panel rounded-2xl border border-white/10">
                  <FolderPlus className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-lg font-display font-bold text-white mb-1">No Projects Found</h3>
                  <p className="text-xs text-zinc-400 mb-6 max-w-sm mx-auto">Create a new 3D spatial project or import from GitHub to launch your Red Noir workspace.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-5 py-2.5 bg-[#ef233c] text-white text-xs font-semibold rounded-xl hover:bg-[#d90429] transition-all inline-flex items-center gap-2 shadow-red-glow-sm"
                  >
                    <Plus className="w-4 h-4" /> Create Project
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'github' && (
          <div className="max-w-3xl mx-auto glass-panel rounded-2xl p-8 space-y-6 border border-white/10">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <Github className="w-7 h-7 text-[#ef233c]" />
              <div>
                <h2 className="font-display text-lg font-bold text-white">GitHub Integration Boundary</h2>
                <p className="text-xs text-zinc-400">Connect GitHub repositories, import codebases, and stage changes securely.</p>
              </div>
            </div>

            <div className="bg-[#ef233c]/10 border border-[#ef233c]/30 rounded-xl p-4 text-xs text-zinc-300 space-y-1.5">
              <div className="font-semibold text-[#ef233c] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Security Isolation Boundary
              </div>
              <p className="text-zinc-400 leading-relaxed">Production GitHub OAuth tokens are handled in ephemeral session memory only. Secrets are never hardcoded or stored in bundle artifacts.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  GitHub Personal Access Token (Session Token)
                </label>
                <div className="flex gap-3">
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={githubTokenInput}
                    onChange={(e) => setGithubTokenInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-[#121215] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#ef233c]/50"
                  />
                  <button
                    onClick={() => {
                      if (githubTokenInput) {
                        setGithubConnected(true);
                      }
                    }}
                    className="px-5 py-2.5 bg-[#ef233c] text-white text-xs font-semibold rounded-xl hover:bg-[#d90429] transition-all shadow-red-glow-sm"
                  >
                    Connect Session
                  </button>
                </div>
              </div>

              {githubConnected && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>GitHub Session Active</span>
                  </div>
                  <button
                    onClick={() => setGithubConnected(false)}
                    className="text-emerald-400 hover:underline text-xs"
                  >
                    Disconnect
                  </button>
                </div>
              )}

              <div className="pt-6 border-t border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white">Import Remote Repository</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="owner/repository-name (e.g. facebook/react)"
                    value={repoSearchInput}
                    onChange={(e) => setRepoSearchInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-[#121215] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#ef233c]/50"
                  />
                  <button
                    onClick={() => {
                      if (!repoSearchInput.trim()) return;
                      setImportingRepo(true);
                      setTimeout(() => {
                        const proj = createProject(
                          repoSearchInput.split('/')[1] || repoSearchInput,
                          `Imported repository: ${repoSearchInput}`,
                          'react-three'
                        );
                        setGithubRepo(repoSearchInput);
                        setImportingRepo(false);
                        navigate(`/workspace/${proj.id}`);
                      }, 1000);
                    }}
                    disabled={importingRepo}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
                  >
                    {importingRepo ? 'Importing...' : 'Import Workspace'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-6 space-y-4 border border-white/10">
              <div className="flex items-center gap-3">
                <Cpu className="w-6 h-6 text-[#ef233c]" />
                <div>
                  <h3 className="font-display font-bold text-white">Vercel Edge Deployment</h3>
                  <p className="text-xs text-zinc-400">Deploy preview builds directly to Vercel</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Configure build webhooks and live deployment previews directly inside your Red Noir workspace.
              </p>
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400 font-mono text-[10px]">
                  Boundary Ready
                </span>
                <button className="text-[#ef233c] hover:underline flex items-center gap-1 font-semibold">
                  Documentation <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-4 border border-white/10">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-[#ef233c]" />
                <div>
                  <h3 className="font-display font-bold text-white">AI Assistant Hub</h3>
                  <p className="text-xs text-zinc-400">Project-aware intelligence engine</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect OpenAI or Anthropic API providers to grant the workspace autonomous file-editing capabilities.
              </p>
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">
                  Mock Fallback Active
                </span>
                <button onClick={() => setActiveTab('settings')} className="text-[#ef233c] hover:underline font-semibold">
                  Configure Keys
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto glass-panel rounded-2xl p-8 space-y-6 border border-white/10">
            <h2 className="font-display text-lg font-bold text-white border-b border-white/10 pb-4">
              Workspace & 3D Spatial Preferences
            </h2>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Enable 3D Spatial Workspace</h4>
                  <p className="text-xs text-zinc-400">Renders the interactive 3D architecture node graph behind the editor.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enable3DWorkspace}
                  onChange={(e) => setEnable3DWorkspace(e.target.checked)}
                  className="w-5 h-5 accent-[#ef233c] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  <h4 className="text-sm font-semibold text-white">3D Rendering Quality</h4>
                  <p className="text-xs text-zinc-400">Adjust performance profiles for weaker or mobile devices.</p>
                </div>
                <select
                  value={render3DQuality}
                  onChange={(e) => setRender3DQuality(e.target.value as 'high' | 'medium' | 'low')}
                  className="px-3.5 py-2 bg-[#121215] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#ef233c]/50"
                >
                  <option value="high">High Quality (Shadows & Shaders)</option>
                  <option value="medium">Medium Standard</option>
                  <option value="low">Low / Mobile (Reduced GPU load)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <h4 className="text-sm font-semibold text-white">AI Assistant Provider Setup</h4>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Provider Strategy</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value as 'mock' | 'openai' | 'anthropic')}
                    className="w-full px-3.5 py-2 bg-[#121215] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#ef233c]/50"
                  >
                    <option value="mock">Built-in Offline Agent (Mock)</option>
                    <option value="openai">OpenAI (User Key)</option>
                    <option value="anthropic">Anthropic Claude (User Key)</option>
                  </select>
                </div>

                {aiProvider !== 'mock' && (
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">API Key (Session Only)</label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={aiApiKey || ''}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#121215] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#ef233c]/50"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 space-y-5 border border-white/15 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-[#ef233c]" /> Create Red Noir 3D Project
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. spatial-visualization-app"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#121215] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#ef233c]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe your application..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#121215] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#ef233c]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Template</label>
                <select
                  value={newProjectTemplate}
                  onChange={(e) => setNewProjectTemplate(e.target.value as 'react-three' | 'vanilla')}
                  className="w-full px-3.5 py-2 bg-[#121215] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#ef233c]/50"
                >
                  <option value="react-three">React + Three.js / React Three Fiber Spatial Starter</option>
                  <option value="vanilla">Vanilla Web IDE Starter</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ef233c] hover:bg-[#d90429] text-white rounded-xl font-semibold text-xs transition-all shadow-red-glow-sm"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

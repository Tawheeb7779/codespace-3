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
  Lock,
  ExternalLink,
  CheckCircle2
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
    <div className="min-h-screen bg-background text-[#dee2f1] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-outline-variant/15 glass-panel px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-dark via-primary-container to-secondary flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-primary-container/20">
            <Boxes className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              CodeSpace 3D
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-primary-container/20 text-primary border border-primary/30">
                PROD IDE
              </span>
            </span>
            <p className="text-xs text-outline">Interactive 3D Web IDE & Architecture Visualizer</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-surface-container/60 p-1 rounded-lg border border-outline-variant/10">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'projects' ? 'bg-primary-container text-white shadow-sm' : 'text-outline hover:text-white'
            }`}
          >
            <FolderPlus className="w-4 h-4" /> Projects
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'github' ? 'bg-primary-container text-white shadow-sm' : 'text-outline hover:text-white'
            }`}
          >
            <Github className="w-4 h-4" /> GitHub
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'integrations' ? 'bg-primary-container text-white shadow-sm' : 'text-outline hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" /> Integrations
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'settings' ? 'bg-primary-container text-white shadow-sm' : 'text-outline hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search projects by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-sm text-white placeholder-outline focus:outline-none focus:border-primary-container transition-all"
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-primary-container hover:bg-primary-container/80 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-container/25"
              >
                <Plus className="w-4 h-4" /> Create New Project
              </button>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="glass-panel-interactive rounded-xl p-5 flex flex-col justify-between group relative cursor-pointer"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-surface-high border border-outline-variant/20 text-primary">
                          <Code2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                            {project.name}
                          </h3>
                          <span className="text-[11px] font-mono text-outline">
                            ID: {project.id}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="p-1.5 text-outline hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-outline-variant text-slate-300 line-clamp-2">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-outline-variant/10 flex items-center justify-between text-xs text-outline">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-tertiary" /> {project.template}
                    </span>
                    <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}

              {filteredProjects.length === 0 && (
                <div className="col-span-full py-16 text-center glass-panel rounded-xl">
                  <FolderPlus className="w-12 h-12 text-outline mx-auto mb-3 opacity-50" />
                  <h3 className="text-lg font-medium text-white mb-1">No Projects Found</h3>
                  <p className="text-sm text-outline mb-4">Create a new 3D project or import one from GitHub to get started.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-primary-container text-white text-sm rounded-lg hover:bg-primary-container/80 transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create Project
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'github' && (
          <div className="max-w-3xl mx-auto glass-panel rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
              <Github className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-white">GitHub Integration Boundary</h2>
                <p className="text-xs text-outline">Connect GitHub repositories, import codebases, and stage changes securely.</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-xs text-amber-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Security Directive
              </div>
              <p>Production GitHub OAuth requires a secure backend session provider. Personal access tokens typed here are kept in isolated session memory only and never published or committed.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  GitHub Personal Access Token (Session Only)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={githubTokenInput}
                    onChange={(e) => setGithubTokenInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-sm text-white focus:outline-none focus:border-primary-container"
                  />
                  <button
                    onClick={() => {
                      if (githubTokenInput) {
                        setGithubConnected(true);
                      }
                    }}
                    className="px-4 py-2 bg-primary-container text-white text-sm font-medium rounded-lg hover:bg-primary-container/80 transition-all"
                  >
                    Connect Session
                  </button>
                </div>
              </div>

              {githubConnected && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>GitHub Session Active</span>
                  </div>
                  <button
                    onClick={() => setGithubConnected(false)}
                    className="text-emerald-400 hover:underline text-[11px]"
                  >
                    Disconnect
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-outline-variant/15 space-y-3">
                <h3 className="text-sm font-medium text-white">Import Repository from GitHub</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="owner/repository-name (e.g. facebook/react)"
                    value={repoSearchInput}
                    onChange={(e) => setRepoSearchInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-sm text-white focus:outline-none focus:border-primary-container"
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
                    className="px-4 py-2 bg-secondary text-slate-950 text-sm font-medium rounded-lg hover:bg-secondary/90 transition-all flex items-center gap-2"
                  >
                    {importingRepo ? 'Importing...' : 'Import to Workspace'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Cpu className="w-6 h-6 text-tertiary" />
                <div>
                  <h3 className="font-semibold text-white">Vercel Deployment Runtime</h3>
                  <p className="text-xs text-outline">Deploy spatial preview builds to Vercel Edge</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Configure build webhooks and live deployment previews directly inside the CodeSpace 3D workspace.
              </p>
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="px-2 py-1 rounded bg-surface-high border border-outline-variant/20 text-outline">
                  Boundary Ready
                </span>
                <button className="text-primary hover:underline flex items-center gap-1">
                  Documentation <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-secondary" />
                <div>
                  <h3 className="font-semibold text-white">AI Coding Assistant Hub</h3>
                  <p className="text-xs text-outline">Project-aware intelligence engine</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect OpenAI or Anthropic API providers to grant the workspace autonomous file-editing capabilities.
              </p>
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Mock Fallback Enabled
                </span>
                <button onClick={() => setActiveTab('settings')} className="text-primary hover:underline">
                  Configure Keys
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto glass-panel rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-outline-variant/15 pb-3">
              Workspace & 3D Preferences
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Enable 3D Spatial Workspace</h4>
                  <p className="text-xs text-outline">Renders the interactive 3D architecture graph behind the editor.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enable3DWorkspace}
                  onChange={(e) => setEnable3DWorkspace(e.target.checked)}
                  className="w-5 h-5 accent-primary-container rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                <div>
                  <h4 className="text-sm font-medium text-white">3D Rendering Quality</h4>
                  <p className="text-xs text-outline">Adjust performance profiles for weaker or mobile devices.</p>
                </div>
                <select
                  value={render3DQuality}
                  onChange={(e) => setRender3DQuality(e.target.value as 'high' | 'medium' | 'low')}
                  className="px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded-md text-xs text-white"
                >
                  <option value="high">High (Shadows & Post-processing)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="low">Low / Mobile (Reduced WebGL load)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-outline-variant/10 space-y-3">
                <h4 className="text-sm font-medium text-white">AI Assistant Provider Configuration</h4>
                <div>
                  <label className="block text-xs text-outline mb-1">Provider Strategy</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value as 'mock' | 'openai' | 'anthropic')}
                    className="w-full px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-md text-xs text-white"
                  >
                    <option value="mock">Mock / Demo Provider (Built-in offline agent)</option>
                    <option value="openai">OpenAI (User Key)</option>
                    <option value="anthropic">Anthropic Claude (User Key)</option>
                  </select>
                </div>

                {aiProvider !== 'mock' && (
                  <div>
                    <label className="block text-xs text-outline mb-1">API Key (Session Only)</label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={aiApiKey || ''}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-md text-xs text-white"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 space-y-5 border border-outline-variant/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-primary" /> Create 3D Project
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. spatial-visualization-app"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-sm text-white focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe your application..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-sm text-white focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Template</label>
                <select
                  value={newProjectTemplate}
                  onChange={(e) => setNewProjectTemplate(e.target.value as 'react-three' | 'vanilla')}
                  className="w-full px-3.5 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-sm text-white focus:outline-none focus:border-primary-container"
                >
                  <option value="react-three">React + Three.js / React Three Fiber Spatial Starter</option>
                  <option value="vanilla">Vanilla Web IDE Template</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-outline hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-container hover:bg-primary-container/80 text-white rounded-lg font-medium text-sm transition-all"
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

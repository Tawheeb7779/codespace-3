import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Search,
  Command,
  BookOpen,
  Code2,
  Sparkles,
  Rocket
} from 'lucide-react';

interface ShortcutItem {
  keyCombo: string;
  description: string;
  category: 'Navigation' | 'Editor' | '3D & Viewports' | 'Terminal';
}

interface DocArticle {
  id: string;
  title: string;
  category: 'Quick Start' | '3D Programming' | 'WebContainer Engine' | 'GitHub Sync';
  summary: string;
  content: string;
}

const KEYBOARD_SHORTCUTS: ShortcutItem[] = [
  { keyCombo: '⌘K / Ctrl+K', description: 'Open Global Command Palette & Workspace File Search', category: 'Navigation' },
  { keyCombo: 'Alt + 1', description: 'Switch Viewport to Code Editor Only', category: '3D & Viewports' },
  { keyCombo: 'Alt + 2', description: 'Switch Viewport to Split 3D Workspace', category: '3D & Viewports' },
  { keyCombo: 'Alt + 3', description: 'Switch Viewport to Full Spatial 3D View', category: '3D & Viewports' },
  { keyCombo: 'Alt + 4', description: 'Switch Viewport to Sandboxed Live Preview', category: '3D & Viewports' },
  { keyCombo: 'Ctrl + S', description: 'Save current active file in Monaco', category: 'Editor' },
  { keyCombo: 'Double Tap / Double Click', description: 'Lerp camera focus smoothly to selected 3D node', category: '3D & Viewports' },
  { keyCombo: 'Esc', description: 'Close any active modal, drawer, or palette', category: 'Navigation' },
];

const DOC_ARTICLES: DocArticle[] = [
  {
    id: 'quick-start',
    title: 'CodeSpace 3D Quick Start Guide',
    category: 'Quick Start',
    summary: 'Learn how to create projects, manage nested files, and run Vite development servers in the browser.',
    content: `Welcome to CodeSpace 3D! All workspace files are saved locally in IndexedDB and mounted into WebAssembly Node.js v22 via WebContainers.`
  },
  {
    id: '3d-guide',
    title: '3D Spatial Graph & Camera Navigation',
    category: '3D Programming',
    summary: 'Master touch and mouse gestures, OrbitControls damping, and custom GLSL fragment shaders.',
    content: `Every project file and folder is represented as a connected 3D node. Touch controls: 1-finger rotate, 2-finger pinch dolly/pan. Double tap to lerp camera focus.`
  },
  {
    id: 'webcontainer-engine',
    title: 'WebContainer Process Execution Engine',
    category: 'WebContainer Engine',
    summary: 'Execute real node, npm install, and npm run dev processes directly inside WebAssembly.',
    content: `CodeSpace 3D uses Cross-Origin-Embedder-Policy (COOP/COEP) headers to isolate SharedArrayBuffer memory for in-browser Node.js execution.`
  },
  {
    id: 'github-sync',
    title: 'GitHub REST Git Data API Sync',
    category: 'GitHub Sync',
    summary: 'Push workspace files directly to remote GitHub repositories without hardcoding secrets.',
    content: `CodeSpace 3D constructs recursive tree diffs and posts blobs, trees, and commits via the GitHub REST API using ephemeral session tokens.`
  }
];

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'docs' | 'api'>('shortcuts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null);

  if (!isOpen) return null;

  const filteredShortcuts = KEYBOARD_SHORTCUTS.filter(
    (s) => s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.keyCombo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocs = DOC_ARTICLES.filter(
    (d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           d.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="glass-panel w-full max-w-2xl rounded-xl p-5 space-y-4 border border-outline-variant/20 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2 shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span>Help & Support Center</span>
          </div>
          <button onClick={onClose} className="p-1 text-outline hover:text-white rounded hover:bg-surface-high">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
          <div className="flex bg-surface-container p-0.5 rounded-lg border border-outline-variant/15 text-[11px] w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                activeTab === 'shortcuts' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
              }`}
            >
              Shortcuts (⌘K)
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                activeTab === 'docs' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
              }`}
            >
              Documentation
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                activeTab === 'api' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
              }`}
            >
              API Reference
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-outline absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-surface-container border border-outline-variant/20 rounded text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
          {/* Keyboard Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-2">
              <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/15 text-[10px] text-outline flex items-center gap-2 font-mono">
                <Command className="w-3.5 h-3.5 text-primary" />
                <span>Interactive keyboard shortcuts for fast workspace navigation.</span>
              </div>

              <div className="space-y-1.5">
                {filteredShortcuts.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-surface-container rounded border border-outline-variant/10">
                    <span className="text-slate-200">{s.description}</span>
                    <kbd className="px-2 py-0.5 bg-surface-high text-primary rounded font-mono text-[10px] border border-outline-variant/20">
                      {s.keyCombo}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentation Articles Tab */}
          {activeTab === 'docs' && (
            <div className="space-y-3">
              {selectedArticle ? (
                <div className="p-4 bg-surface-container rounded-lg border border-outline-variant/15 space-y-2">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-primary hover:underline text-[11px] font-mono block mb-2"
                  >
                    ← Back to Articles List
                  </button>
                  <h3 className="font-semibold text-white text-sm">{selectedArticle.title}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/30 font-mono inline-block">
                    {selectedArticle.category}
                  </span>
                  <p className="text-slate-300 leading-relaxed text-xs pt-2 whitespace-pre-wrap">
                    {selectedArticle.content}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedArticle(doc)}
                      className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-1 hover:border-primary/40 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-slate-100 flex items-center gap-1.5 text-xs">
                          <BookOpen className="w-3.5 h-3.5 text-secondary" /> {doc.title}
                        </h4>
                        <span className="text-[10px] font-mono text-outline">{doc.category}</span>
                      </div>
                      <p className="text-[11px] text-outline line-clamp-2">{doc.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* API Reference Tab */}
          {activeTab === 'api' && (
            <div className="space-y-2">
              <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-100 font-mono">
                  <Code2 className="w-4 h-4 text-emerald-400" /> GitHubPushService API
                </div>
                <pre className="p-2 bg-[#0a0e17] text-slate-200 font-mono text-[10px] rounded border border-outline-variant/20 overflow-x-auto">
                  {`GitHubPushService.pushChanges(token, repoFullName, branchName, files, commitMessage)`}
                </pre>
                <p className="text-[11px] text-outline leading-relaxed">
                  Executes recursive tree diffs and commits non-folder workspace files directly via GitHub REST Git Data API.
                </p>
              </div>

              <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-100 font-mono">
                  <Rocket className="w-4 h-4 text-primary" /> WebContainerProcess API
                </div>
                <pre className="p-2 bg-[#0a0e17] text-slate-200 font-mono text-[10px] rounded border border-outline-variant/20 overflow-x-auto">
                  {`WebContainerProvider.spawnProcess(command, args, onStdout)`}
                </pre>
                <p className="text-[11px] text-outline leading-relaxed">
                  Spawns WebAssembly Node.js processes and streams stdout/stderr output directly into xterm.js terminals.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-outline-variant/10 flex justify-between items-center text-[10px] text-outline shrink-0">
          <span>CodeSpace 3D v1.0.0 Product Documentation</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-secondary" /> Offline Local Documentation Active
          </span>
        </div>
      </div>
    </div>
  );
};

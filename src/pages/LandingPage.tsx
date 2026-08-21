import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Code2,
  Terminal,
  Cpu,
  Layers,
  Globe,
  ShieldCheck,
  ArrowRight,
  Play,
  CheckCircle2,
  Sparkles,
  Command,
  Github,
  Cloud
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'editor' | '3d' | 'preview' | 'terminal'>('3d');

  return (
    <div className="min-h-screen bg-[#050507] text-[#e4e4e7] selection:bg-[#ef233c]/30 selection:text-white font-sans overflow-x-hidden">
      {/* Background Grids & Ambient Red Glow */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#ef233c]/15 via-[#ef233c]/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Floating Red Noir Navigation */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-6xl">
        <nav className="glass-panel rounded-full px-6 py-3.5 flex items-center justify-between border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ef233c] to-[#8d0801] flex items-center justify-center shadow-red-glow-sm">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-extrabold text-lg tracking-wider text-white">
              CODESPACE <span className="text-[#ef233c]">3D</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#hero" className="hover:text-white transition-colors">Workspace</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Command Center
            </button>
            <button
              onClick={() => navigate('/workspace/demo-project')}
              className="px-5 py-2.5 rounded-full bg-[#ef233c] hover:bg-[#d90429] text-white text-sm font-semibold shadow-red-glow-sm hover:shadow-red-glow transition-all flex items-center gap-2 group"
            >
              <span>Start Building</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-36 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#ef233c]/30 bg-[#ef233c]/10 text-[#ef233c] text-xs font-mono font-medium mb-8 shadow-red-glow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PRODUCTION-READY 3D WEB IDE & WASM RUNTIME</span>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] max-w-5xl text-white">
          Build. Run. <br />
          Ship. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ef233c] via-[#ff2a2a] to-[#8d0801] shadow-red-glow-lg">In 3D.</span>
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-zinc-400 max-w-3xl leading-relaxed font-sans">
          The next-generation browser development workspace combining full-stack Node.js WASM execution, interactive spatial code visualization, Monaco editor, and project-aware AI.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate('/workspace/demo-project')}
            className="px-8 py-4 rounded-full bg-[#ef233c] hover:bg-[#d90429] text-white font-semibold text-base shadow-red-glow transition-all flex items-center gap-3 group"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Launch Web IDE</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 rounded-full bg-[#121215] hover:bg-[#18181b] border border-white/10 hover:border-[#ef233c]/40 text-white font-semibold text-base transition-all flex items-center gap-2"
          >
            <Command className="w-5 h-5 text-[#ef233c]" />
            <span>Open Command Center</span>
          </button>
        </div>

        {/* Real CodeSpace 3D IDE Workspace Showcase Frame */}
        <div className="mt-16 w-full max-w-6xl rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl shadow-black/80 overflow-hidden text-left relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#ef233c]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* Mock IDE Topbar */}
          <div className="px-5 py-3 bg-[#050507] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-4 font-mono text-xs text-zinc-400 flex items-center gap-2">
                <Boxes className="w-3.5 h-3.5 text-[#ef233c]" />
                codespace-3d-demo / src / App.tsx
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#121215] p-1 rounded-lg border border-white/5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('3d')}
                className={`px-3 py-1 rounded-md transition-all ${activeTab === '3d' ? 'bg-[#ef233c] text-white shadow-red-glow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                3D Graph
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-md transition-all ${activeTab === 'editor' ? 'bg-[#ef233c] text-white shadow-red-glow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                Monaco Editor
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-all ${activeTab === 'preview' ? 'bg-[#ef233c] text-white shadow-red-glow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                Live Preview
              </button>
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-3 py-1 rounded-md transition-all ${activeTab === 'terminal' ? 'bg-[#ef233c] text-white shadow-red-glow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                Terminal
              </button>
            </div>
          </div>

          {/* Interactive Component Area */}
          <div className="h-[460px] bg-[#09090b] relative flex">
            {/* Sidebar mini */}
            <div className="w-64 border-r border-white/10 bg-[#050507] p-4 flex flex-col gap-3 font-mono text-xs text-zinc-400">
              <div className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Explorer</div>
              <div className="flex items-center gap-2 text-white bg-[#ef233c]/10 border border-[#ef233c]/30 px-2.5 py-1.5 rounded-md">
                <Code2 className="w-4 h-4 text-[#ef233c]" />
                <span>App.tsx</span>
              </div>
              <div className="flex items-center gap-2 hover:text-white px-2.5 py-1">
                <Code2 className="w-4 h-4 text-blue-400" />
                <span>SpatialWorkspace.tsx</span>
              </div>
              <div className="flex items-center gap-2 hover:text-white px-2.5 py-1">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>WebContainer.ts</span>
              </div>
              <div className="flex items-center gap-2 hover:text-white px-2.5 py-1">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>terminal.config.json</span>
              </div>
            </div>

            {/* Main Content Showcase depending on activeTab */}
            <div className="flex-1 p-6 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#09090b] via-[#0e0e11] to-[#050507]">
              {activeTab === '3d' && (
                <div className="h-full flex flex-col items-center justify-center relative">
                  <div className="absolute inset-0 bg-red-grid-pattern opacity-30" />
                  <div className="relative z-10 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#ef233c] to-[#8d0801] p-0.5 shadow-red-glow flex items-center justify-center animate-pulse">
                      <div className="w-full h-full bg-[#09090b] rounded-[14px] flex items-center justify-center">
                        <Boxes className="w-12 h-12 text-[#ef233c]" />
                      </div>
                    </div>
                    <div className="font-display text-xl font-bold text-white mb-2">Interactive 3D Spatial Project Graph</div>
                    <p className="text-xs text-zinc-400 max-w-md">Connected React Three Fiber spatial nodes representing files, components, and module dependencies in 3D WebGL space.</p>
                  </div>
                </div>
              )}

              {activeTab === 'editor' && (
                <div className="font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto space-y-1">
                  <div><span className="text-purple-400">import</span> React <span className="text-purple-400">from</span> <span className="text-emerald-300">'react'</span>;</div>
                  <div><span className="text-purple-400">import</span> &#123; Spatial3DWorkspace &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">'./Spatial3DWorkspace'</span>;</div>
                  <br />
                  <div><span className="text-purple-400">export function</span> <span className="text-yellow-300">CodeSpaceApp</span>() &#123;</div>
                  <div className="pl-4"><span className="text-purple-400">return</span> (</div>
                  <div className="pl-8 text-blue-300">&lt;<span className="text-red-400">Spatial3DWorkspace</span></div>
                  <div className="pl-12 text-zinc-400">accentColor=<span className="text-emerald-300">"#ef233c"</span></div>
                  <div className="pl-12 text-zinc-400">wasmRuntime=<span className="text-emerald-300">"WebContainer"</span></div>
                  <div className="pl-8 text-blue-300">/&gt;</div>
                  <div className="pl-4">);</div>
                  <div>&#125;</div>
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="h-full border border-white/10 rounded-xl bg-white/5 p-6 flex flex-col items-center justify-center text-center">
                  <Globe className="w-10 h-10 text-[#ef233c] mb-3 animate-bounce" />
                  <div className="font-display text-lg font-bold text-white">In-Browser Live Web Preview</div>
                  <div className="text-xs text-zinc-400 mt-1">Rendered with direct WASM dev server output & responsive device viewports.</div>
                </div>
              )}

              {activeTab === 'terminal' && (
                <div className="font-mono text-xs text-zinc-300 space-y-2">
                  <div className="text-emerald-400">$ node --version</div>
                  <div className="text-zinc-500">v22.11.0 (WebContainer WASM Isolate)</div>
                  <div className="text-emerald-400">$ npm run dev</div>
                  <div className="text-zinc-400">[Vite] server running at http://localhost:5173/</div>
                  <div className="text-[#ef233c] font-bold">✔ Ready for compilation.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Architected for <span className="text-[#ef233c]">Spatial Engineering</span>
          </h2>
          <p className="mt-4 text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
            A complete developer platform blending WebAssembly execution, 3D WebGL scenes, and production cloud tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Item 1: 3D Workspace */}
          <div className="md:col-span-2 glass-panel-interactive rounded-2xl p-8 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#ef233c]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#ef233c]/20 transition-all" />
            <Boxes className="w-10 h-10 text-[#ef233c] mb-6" />
            <h3 className="font-display text-2xl font-bold text-white mb-3">Interactive 3D Spatial Graph</h3>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
              Visualize your codebase as connected 3D spatial nodes. Navigate file structures, dependencies, and component hierarchies seamlessly in WebGL space with smooth camera lerping and gesture controls.
            </p>
          </div>

          {/* Bento Item 2: Monaco Editor */}
          <div className="glass-panel-interactive rounded-2xl p-8 border border-white/10 flex flex-col justify-between">
            <div>
              <Code2 className="w-10 h-10 text-[#ef233c] mb-6" />
              <h3 className="font-display text-xl font-bold text-white mb-2">Monaco Code Engine</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Full VS Code-grade editing experience with syntax highlighting, auto-completion, multi-tabs, and language servers.
              </p>
            </div>
          </div>

          {/* Bento Item 3: WebContainer WASM */}
          <div className="glass-panel-interactive rounded-2xl p-8 border border-white/10">
            <Cpu className="w-10 h-10 text-[#ef233c] mb-6" />
            <h3 className="font-display text-xl font-bold text-white mb-2">WASM Node.js Execution</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Run real Node.js processes inside the browser sandbox using WebContainers without needing remote server environments.
            </p>
          </div>

          {/* Bento Item 4: AI Assistant & OSV Security */}
          <div className="md:col-span-2 glass-panel-interactive rounded-2xl p-8 border border-white/10 relative overflow-hidden">
            <Sparkles className="w-10 h-10 text-[#ef233c] mb-6" />
            <h3 className="font-display text-2xl font-bold text-white mb-3">Project-Aware AI Assistant & Security Vault</h3>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
              In-context code refactoring, error diagnosis, SHA-256 integrity snapshots, and live OSV vulnerability auditing directly in your workspace sidebar.
            </p>
          </div>
        </div>
      </section>

      {/* Development Workflow Section */}
      <section id="workflow" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            The <span className="text-[#ef233c]">5-Step</span> Red Noir Workflow
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
          {[
            { step: '01', title: 'Create', desc: 'Bootstrap project or import from GitHub' },
            { step: '02', title: 'Code', desc: 'Edit in Monaco or spatial 3D nodes' },
            { step: '03', title: 'Run', desc: 'Execute WASM terminal commands' },
            { step: '04', title: 'Preview', desc: 'Inspect live responsive viewports' },
            { step: '05', title: 'Ship', desc: 'Deploy directly to Vercel or GitHub' },
          ].map((item, index) => (
            <div key={index} className="glass-panel rounded-xl p-6 border border-white/10 relative flex flex-col items-center">
              <div className="font-mono text-xs font-bold text-[#ef233c] mb-2">{item.step}</div>
              <div className="font-display font-bold text-white text-lg mb-1">{item.title}</div>
              <div className="text-xs text-zinc-400">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations Strip */}
      <section id="integrations" className="py-16 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Connected Cloud Infrastructure</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-10 text-zinc-400 font-display font-bold text-lg">
          <div className="flex items-center gap-2 hover:text-white transition-colors">
            <Github className="w-5 h-5 text-[#ef233c]" />
            <span>GitHub REST API</span>
          </div>
          <div className="flex items-center gap-2 hover:text-white transition-colors">
            <Cloud className="w-5 h-5 text-[#ef233c]" />
            <span>Supabase Auth & RBAC</span>
          </div>
          <div className="flex items-center gap-2 hover:text-white transition-colors">
            <Globe className="w-5 h-5 text-[#ef233c]" />
            <span>Vercel Deployments</span>
          </div>
          <div className="flex items-center gap-2 hover:text-white transition-colors">
            <ShieldCheck className="w-5 h-5 text-[#ef233c]" />
            <span>OSV Vulnerability Audit</span>
          </div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white">
            Developer <span className="text-[#ef233c]">Plans</span>
          </h2>
          <p className="mt-4 text-zinc-400 text-sm sm:text-base">Start building for free or unlock unlimited spatial computing cloud isolates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="glass-panel rounded-2xl p-8 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-2">Free</div>
              <div className="font-display text-4xl font-extrabold text-white mb-6">$0 <span className="text-xs font-normal text-zinc-500">/ forever</span></div>
              <ul className="space-y-3 text-sm text-zinc-300 font-sans mb-8">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-[#ef233c]" /> Local WASM WebContainer</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-[#ef233c]" /> Monaco Code Editor</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-[#ef233c]" /> 3D Spatial Node Graph</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/workspace/demo-project')}
              className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
            >
              Start Free
            </button>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="glass-panel rounded-2xl p-8 border-2 border-[#ef233c] shadow-red-glow relative flex flex-col justify-between bg-[#0e0e11]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#ef233c] text-white text-[10px] font-mono font-bold tracking-wider uppercase">
              Most Popular
            </div>
            <div>
              <div className="text-sm font-mono text-[#ef233c] uppercase tracking-wider mb-2">Pro Developer</div>
              <div className="font-display text-4xl font-extrabold text-white mb-6">$29 <span className="text-xs font-normal text-zinc-500">/ month</span></div>
              <ul className="space-y-3 text-sm text-zinc-300 font-sans mb-8">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-[#ef233c]" /> Everything in Free</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-[#ef233c]" /> Unlimited Supabase RBAC Sync</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-[#ef233c]" /> AI Assistant & GLSL Shader Studio</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-[#ef233c]" /> Security Backup Snapshot Vault</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/workspace/demo-project')}
              className="w-full py-3 rounded-full bg-[#ef233c] hover:bg-[#d90429] text-white font-semibold text-sm shadow-red-glow-sm transition-all"
            >
              Get Pro Access
            </button>
          </div>

          {/* Team Tier */}
          <div className="glass-panel rounded-2xl p-8 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-2">Team Enterprise</div>
              <div className="font-display text-4xl font-extrabold text-white mb-6">$99 <span className="text-xs font-normal text-zinc-500">/ month</span></div>
              <ul className="space-y-3 text-sm text-zinc-300 font-sans mb-8">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-[#ef233c]" /> Custom Vercel Deploy Keys</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-[#ef233c]" /> Dedicated GitHub REST Bridge</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-[#ef233c]" /> 24/7 Priority Support</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/workspace/demo-project')}
              className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Large Faded Red Noir Footer */}
      <footer className="py-20 px-6 border-t border-white/10 bg-[#050507] relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#ef233c] flex items-center justify-center">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-extrabold text-lg text-white">CODESPACE <span className="text-[#ef233c]">3D</span></span>
            </div>
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
              Production 3D Web IDE featuring WebContainer WASM runtime, Monaco Editor, interactive 3D spatial node graphs, and Supabase RBAC synchronization.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 font-sans text-xs text-zinc-400">
            <div>
              <div className="font-bold text-white mb-3 uppercase tracking-wider">Product</div>
              <ul className="space-y-2">
                <li><a href="#hero" className="hover:text-[#ef233c]">Workspace</a></li>
                <li><a href="#features" className="hover:text-[#ef233c]">Features</a></li>
                <li><a href="#pricing" className="hover:text-[#ef233c]">Pricing</a></li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-white mb-3 uppercase tracking-wider">Platform</div>
              <ul className="space-y-2">
                <li><a href="/dashboard" className="hover:text-[#ef233c]">Dashboard</a></li>
                <li><a href="/workspace/demo-project" className="hover:text-[#ef233c]">3D Editor</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Large Faded Backdrop Text */}
        <div className="mt-16 text-center select-none pointer-events-none">
          <span className="font-display font-black text-6xl sm:text-9xl tracking-widest text-white/[0.03] uppercase">
            CODESPACE 3D
          </span>
        </div>
      </footer>
    </div>
  );
}

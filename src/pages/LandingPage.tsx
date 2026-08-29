import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Boxes,
  Code2,
  Terminal,
  Globe,
  ArrowRight,
  Play,
  CheckCircle2,
  Sparkles,
  Github,
  Database,
  Box,
  Server,
  Zap,
  LayoutGrid,
  Rocket,
  FolderPlus,
  Bot,
} from 'lucide-react';
import { AuthModal } from '../components/auth/AuthModal';
import { Spatial3DWorkspace } from '../components/workspace/Spatial3DWorkspace';
import { PRICING_TIERS } from '../data/pricing';

const FEATURES = [
  {
    icon: Boxes,
    title: '3D Project Workspace',
    description:
      'Your project structure rendered as an interactive 3D graph - navigate nodes, see dependencies, and jump straight into a file from spatial view.',
  },
  {
    icon: Code2,
    title: 'Powerful Code Editor',
    description:
      'Monaco editor with real multi-file tabs, syntax highlighting for 20+ languages, dirty-state tracking, and instant save.',
  },
  {
    icon: Globe,
    title: 'Live Preview',
    description:
      'A real running application, not a screenshot - the actual dev server output, updating as you edit and save.',
  },
  {
    icon: Terminal,
    title: 'Integrated Terminal',
    description:
      'A genuine terminal backed by a real runtime - install packages, run scripts, and see actual process output.',
  },
  {
    icon: Github,
    title: 'GitHub Integration',
    description: 'Import an existing repository straight into a real, editable project - no fake sync, no placeholders.',
  },
  {
    icon: Bot,
    title: 'AI Coding Agent',
    description:
      'Describe what you want built. The agent inspects your project, writes and edits real files, installs dependencies, runs the project, and fixes what it finds broken.',
  },
];

const WORKFLOW = [
  { step: '01', title: 'Create', description: 'Start a new project or import from GitHub.', icon: FolderPlus },
  { step: '02', title: 'Code', description: 'Write and organize code.', icon: Code2 },
  { step: '03', title: 'Run', description: 'Run and preview the real project.', icon: Play },
  { step: '04', title: 'Ship', description: 'Prepare and deploy the project using real integrations.', icon: Rocket },
];

const INTEGRATIONS: { name: string; icon: typeof Github; status: 'live' | 'planned' }[] = [
  { name: 'GitHub', icon: Github, status: 'live' },
  { name: 'Supabase', icon: Database, status: 'live' },
  { name: 'Vercel', icon: Boxes, status: 'live' },
  { name: 'Docker', icon: Box, status: 'planned' },
  { name: 'AWS', icon: Server, status: 'planned' },
  { name: 'Cloudflare', icon: Zap, status: 'planned' },
  { name: 'Netlify', icon: Globe, status: 'planned' },
  { name: 'More', icon: LayoutGrid, status: 'planned' },
];

const HERO_INTEGRATIONS = INTEGRATIONS.filter((i) =>
  ['GitHub', 'Supabase', 'Docker', 'Vercel', 'Cloudflare'].includes(i.name)
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const scrollToShowcase = () => {
    document.getElementById('hero-showcase')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#e4e4e7] selection:bg-[#ef233c]/30 selection:text-white font-sans overflow-x-hidden">
      {/* Background Grids & Ambient Red Glow */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#ef233c]/15 via-[#ef233c]/5 to-transparent blur-[120px] pointer-events-none" />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

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

          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400">
            <a href="#hero" className="hover:text-white transition-colors">Workspace</a>
            <Link to="/dashboard" className="hover:text-white transition-colors">Projects</Link>
            <a href="#integrations" className="hover:text-white transition-colors">GitHub</a>
            <a href="#integrations" className="hover:text-white transition-colors">Cloud</a>
            <span className="text-zinc-600 cursor-default" title="Coming soon">Docs</span>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/dashboard')}
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
          The next-generation browser development workspace combining full-stack Node.js WASM execution, interactive spatial code visualization, Monaco editor, and a project-aware AI coding agent.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 rounded-full bg-[#ef233c] hover:bg-[#d90429] text-white font-semibold text-base shadow-red-glow transition-all flex items-center gap-3 group"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Building Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={scrollToShowcase}
            className="px-8 py-4 rounded-full bg-[#121215] hover:bg-[#18181b] border border-white/10 hover:border-[#ef233c]/40 text-white font-semibold text-base transition-all flex items-center gap-2"
          >
            <Boxes className="w-5 h-5 text-[#ef233c]" />
            <span>Watch Demo</span>
          </button>
        </div>

        {/* Integration indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {HERO_INTEGRATIONS.map(({ name, icon: Icon, status }) => (
            <div key={name} className="flex items-center gap-1.5 text-xs text-zinc-500" title={status === 'planned' ? `${name} - planned integration` : name}>
              <Icon className={`w-3.5 h-3.5 ${status === 'live' ? 'text-zinc-400' : 'text-zinc-600'}`} />
              <span className={status === 'planned' ? 'text-zinc-600' : ''}>{name}</span>
              {status === 'planned' && <span className="text-[9px] uppercase tracking-wide text-zinc-700">soon</span>}
            </div>
          ))}
        </div>

        {/* Real CodeSpace 3D Workspace Showcase - genuine Spatial3DWorkspace, not a screenshot */}
        <div
          id="hero-showcase"
          className="mt-16 w-full max-w-6xl rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl shadow-black/80 overflow-hidden text-left relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-[#ef233c]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />

          <div className="px-5 py-3 bg-[#050507] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-4 font-mono text-xs text-zinc-400 flex items-center gap-2">
                <Boxes className="w-3.5 h-3.5 text-[#ef233c]" />
                Live 3D Spatial Graph - the real workspace, not a mock
              </span>
            </div>
          </div>

          <div className="h-[460px] bg-[#09090b] relative">
            <Spatial3DWorkspace />
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Architected for <span className="text-[#ef233c]">Spatial Engineering</span>
          </h2>
          <p className="mt-4 text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
            Every feature below runs against the real workspace - nothing here is a mockup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="glass-panel-interactive rounded-2xl p-6 border border-white/10 hover:border-[#ef233c]/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#ef233c]" />
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* A Better Way to Build - Workflow */}
      <section id="workflow" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            A Better <span className="text-[#ef233c]">Way to Build</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {WORKFLOW.map(({ step, title, description, icon: Icon }, i) => (
            <div key={step} className="relative flex flex-col items-center text-center">
              {i < WORKFLOW.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-[#ef233c]/40 to-transparent" />
              )}
              <div className="w-16 h-16 rounded-2xl bg-[#0e0e11] border border-[#ef233c]/30 flex items-center justify-center mb-4 shadow-red-glow-sm relative z-10">
                <Icon className="w-6 h-6 text-[#ef233c]" />
              </div>
              <div className="text-[10px] font-mono text-zinc-600 mb-1">{step}</div>
              <h3 className="font-display font-bold text-white text-lg mb-1.5">{title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[200px]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Connect Everything - Integrations */}
      <section id="integrations" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Connect <span className="text-[#ef233c]">Everything</span>
          </h2>
          <p className="mt-4 text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
            GitHub, Supabase, and Vercel are live today. The rest are on the roadmap - shown honestly, not faked.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {INTEGRATIONS.map(({ name, icon: Icon, status }) => (
            <div
              key={name}
              className={`glass-panel rounded-xl p-5 border flex flex-col items-center gap-2.5 text-center ${
                status === 'live' ? 'border-white/10' : 'border-white/5 opacity-60'
              }`}
            >
              <Icon className={`w-6 h-6 ${status === 'live' ? 'text-[#ef233c]' : 'text-zinc-500'}`} />
              <span className="text-xs font-medium text-white">{name}</span>
              <span
                className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                  status === 'live' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-zinc-500'
                }`}
              >
                {status === 'live' ? 'Connected' : 'Planned'}
              </span>
            </div>
          ))}
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
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`glass-panel rounded-2xl p-8 flex flex-col justify-between relative ${
                tier.highlighted
                  ? 'border-2 border-[#ef233c] shadow-red-glow bg-[#0e0e11]'
                  : 'border border-white/10'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#ef233c] text-white text-[10px] font-mono font-bold tracking-wider uppercase">
                  Most Popular
                </div>
              )}
              <div>
                <div className={`text-sm font-mono uppercase tracking-wider mb-2 ${tier.highlighted ? 'text-[#ef233c]' : 'text-zinc-400'}`}>
                  {tier.name}
                </div>
                <div className="font-display text-4xl font-extrabold text-white mb-6">
                  {tier.price} <span className="text-xs font-normal text-zinc-500">{tier.period}</span>
                </div>
                <ul className="space-y-3 text-sm text-zinc-300 font-sans mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#ef233c] shrink-0" /> {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {tier.ctaAction === 'contact' ? (
                <a
                  href="mailto:sales@codespace3d.dev?subject=Team%20Enterprise%20plan"
                  className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all text-center"
                >
                  {tier.ctaLabel}
                </a>
              ) : (
                <button
                  onClick={() => (navigate('/dashboard'))}
                  className={`w-full py-3 rounded-full font-semibold text-sm transition-all ${
                    tier.highlighted
                      ? 'bg-[#ef233c] hover:bg-[#d90429] text-white shadow-red-glow-sm'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {tier.ctaLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center border-t border-white/10">
        <h2 className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Ready to Build <br />
          the <span className="text-[#ef233c]">Future?</span>
        </h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-10 px-8 py-4 rounded-full bg-[#ef233c] hover:bg-[#d90429] text-white font-semibold text-base shadow-red-glow transition-all inline-flex items-center gap-3 group"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Start Building Now</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/10 bg-[#050507] relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#ef233c] flex items-center justify-center">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-extrabold text-lg text-white">CODESPACE <span className="text-[#ef233c]">3D</span></span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed mb-5">
              Production 3D Web IDE featuring WebContainer WASM runtime, Monaco Editor, interactive 3D spatial node graphs, and an AI coding agent.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
              <input
                type="email"
                placeholder="you@example.com"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[#0e0e11] border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ef233c]/50"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors shrink-0"
              >
                Stay in the loop
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 font-sans text-xs text-zinc-400">
            <div>
              <div className="font-bold text-white mb-3 uppercase tracking-wider">Product</div>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-[#ef233c]">Features</a></li>
                <li><a href="#hero" className="hover:text-[#ef233c]">Workspace</a></li>
                <li><a href="#pricing" className="hover:text-[#ef233c]">Pricing</a></li>
                <li><span className="text-zinc-600 cursor-default">Changelog</span></li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-white mb-3 uppercase tracking-wider">Resources</div>
              <ul className="space-y-2">
                <li><span className="text-zinc-600 cursor-default">Docs</span></li>
                <li><span className="text-zinc-600 cursor-default">Guides</span></li>
                <li><span className="text-zinc-600 cursor-default">API Reference</span></li>
                <li><span className="text-zinc-600 cursor-default">Blog</span></li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-white mb-3 uppercase tracking-wider">Company</div>
              <ul className="space-y-2">
                <li><span className="text-zinc-600 cursor-default">About</span></li>
                <li><span className="text-zinc-600 cursor-default">Careers</span></li>
                <li><a href="mailto:hello@codespace3d.dev" className="hover:text-[#ef233c]">Contact</a></li>
                <li><span className="text-zinc-600 cursor-default">Legal</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-14 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-600">
          <span>&copy; {new Date().getFullYear()} CodeSpace 3D. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <span className="cursor-default">Terms</span>
            <span className="cursor-default">Privacy</span>
            <span className="cursor-default">Security</span>
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

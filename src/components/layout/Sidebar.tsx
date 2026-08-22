import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderTree,
  Code2,
  Terminal,
  Play,
  GitBranch,
  Github,
  Cloud,
  Package,
  Boxes,
  Sparkles,
  CheckSquare,
  BarChart3,
  Database,
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/workspace', label: 'Workspace', icon: FolderTree },
  { path: '/editor', label: 'Code Editor', icon: Code2 },
  { path: '/terminal', label: 'Terminal', icon: Terminal },
  { path: '/preview', label: 'Live Preview', icon: Play },
  { path: '/source-control', label: 'Git Control', icon: GitBranch },
  { path: '/github', label: 'GitHub', icon: Github },
  { path: '/integrations', label: 'Integrations', icon: Cloud },
  { path: '/packages', label: 'Packages', icon: Package },
  { path: '/assets', label: '3D Assets', icon: Boxes },
  { path: '/ai', label: 'Nexus AI', icon: Sparkles },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/sql', label: 'SQL Studio', icon: Database },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const location = useLocation();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#171c26]/80 backdrop-blur-md border-r border-white/10 w-64 text-sm font-medium select-none">
      {/* Brand Header inside Sidebar */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
            3D
          </div>
          <div>
            <div className="font-bold tracking-wide text-white font-sans text-base">CodeSpace 3D</div>
            <div className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">Spatial IDE v3.4</div>
          </div>
        </div>
        {mobileOpen && (
          <button onClick={onCloseMobile} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/workspace' && location.pathname === '/');

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive: navActive }) => `
                flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150
                ${navActive || isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-white/10 text-xs font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>GPU WebGL: Active</span>
        </div>
        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300">60 FPS</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block h-full z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative z-10 w-64 h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

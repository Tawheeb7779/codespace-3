import React from 'react';
import {
  FolderTree,
  Search,
  GitPullRequest,
  Boxes,
  Package,
  FolderArchive,
  CheckSquare,
  MessageSquare,
  Activity,
  Settings,
  Bot,
  Database,
  Code2
} from 'lucide-react';

export type SidebarTab =
  | 'explorer'
  | 'search'
  | 'packages'
  | 'assets'
  | 'tasks'
  | 'chat'
  | 'analytics'
  | 'sql'
  | 'shader'
  | 'git'
  | 'graph3d'
  | 'settings';

interface SidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  toggleAiAssistant: () => void;
  isAiOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  toggleAiAssistant,
  isAiOpen,
}) => {
  const navItems: { id: SidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'explorer', label: 'Explorer', icon: FolderTree },
    { id: 'search', label: 'Search (⌘K)', icon: Search },
    { id: 'packages', label: 'Package Manager', icon: Package },
    { id: 'assets', label: 'Assets Manager', icon: FolderArchive },
    { id: 'tasks', label: 'Tasks Board', icon: CheckSquare },
    { id: 'chat', label: 'Team Channels', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics Telemetry', icon: Activity },
    { id: 'sql', label: 'Database & SQL Studio', icon: Database },
    { id: 'shader', label: 'GLSL Shader Studio', icon: Code2 },
    { id: 'git', label: 'Source Control', icon: GitPullRequest },
    { id: 'graph3d', label: '3D Graph', icon: Boxes },
  ];

  return (
    <aside className="w-12 bg-[#050507] border-r border-white/10 flex flex-col items-center py-2 justify-between z-30 select-none">
      <div className="flex flex-col gap-1 w-full px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative ${
                isActive
                  ? 'bg-[#ef233c]/20 text-[#ef233c] border-l-2 border-[#ef233c] shadow-red-glow-sm'
                  : 'text-zinc-500 hover:text-white hover:bg-white/10'
              }`}
              title={item.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1 w-full px-1">
        <button
          onClick={toggleAiAssistant}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isAiOpen
              ? 'bg-[#ef233c]/20 text-[#ef233c] border-l-2 border-[#ef233c] shadow-red-glow-sm'
              : 'text-zinc-500 hover:text-[#ef233c] hover:bg-white/10'
          }`}
          title="AI Assistant Drawer"
        >
          <Bot className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'settings'
              ? 'bg-[#ef233c]/20 text-[#ef233c] border-l-2 border-[#ef233c] shadow-red-glow-sm'
              : 'text-zinc-500 hover:text-white hover:bg-white/10'
          }`}
          title="Workspace Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

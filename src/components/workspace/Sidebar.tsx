import React from 'react';
import {
  FolderTree,
  Search,
  GitPullRequest,
  Boxes,
  Globe,
  Settings,
  Bot
} from 'lucide-react';

export type SidebarTab = 'explorer' | 'search' | 'git' | 'graph3d' | 'integrations' | 'settings';

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
    { id: 'search', label: 'Search', icon: Search },
    { id: 'git', label: 'Source Control', icon: GitPullRequest },
    { id: 'graph3d', label: '3D Graph', icon: Boxes },
    { id: 'integrations', label: 'Integrations', icon: Globe },
  ];

  return (
    <aside className="w-12 bg-surface-low border-r border-outline-variant/15 flex flex-col items-center py-2 justify-between z-30 select-none">
      <div className="flex flex-col gap-1 w-full px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group relative ${
                isActive
                  ? 'bg-primary-container/20 text-primary border-l-2 border-primary'
                  : 'text-outline hover:text-white hover:bg-surface-high'
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
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            isAiOpen
              ? 'bg-secondary/20 text-secondary border-l-2 border-secondary'
              : 'text-outline hover:text-secondary hover:bg-surface-high'
          }`}
          title="AI Assistant"
        >
          <Bot className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTab === 'settings'
              ? 'bg-primary-container/20 text-primary border-l-2 border-primary'
              : 'text-outline hover:text-white hover:bg-surface-high'
          }`}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

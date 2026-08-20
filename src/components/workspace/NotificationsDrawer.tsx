import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  ShieldAlert,
  Info,
  Sparkles,
  Cloud
} from 'lucide-react';

export interface WorkspaceNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'ai';
  timestamp: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: WorkspaceNotification[] = [
  { id: '1', title: 'WebContainer Dev Server', message: 'Vite HMR dev server initialized on port 5173.', type: 'info', timestamp: '10:00 AM', read: false },
  { id: '2', title: 'OSV Security Scan', message: '0 vulnerability advisories detected in workspace package manifest.', type: 'success', timestamp: '10:05 AM', read: false },
  { id: '3', title: 'Nexus AI Assistant', message: 'SpatialBox.tsx component generated and compiled on workspace disk.', type: 'ai', timestamp: '10:12 AM', read: false },
];

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>(INITIAL_NOTIFICATIONS);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const getNotificationIcon = (type: WorkspaceNotification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-primary" />;
      case 'warning':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'success':
        return <Cloud className="w-4 h-4 text-emerald-400" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-secondary" />;
    }
  };

  return (
    <div className="w-80 bg-surface-low border-l border-outline-variant/15 flex flex-col h-full z-40 select-none shadow-2xl">
      {/* Header */}
      <div className="h-11 px-3 bg-surface-container border-b border-outline-variant/15 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-100 font-semibold text-xs">
          <Bell className="w-4 h-4 text-primary" />
          <span>NOTIFICATION CENTER</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary-container text-white font-mono">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleMarkAllRead}
            className="p-1 hover:text-white text-outline rounded hover:bg-surface-high"
            title="Mark all read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1 hover:text-white text-outline rounded hover:bg-surface-high">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => handleMarkRead(n.id)}
            className={`p-3 rounded-lg border transition-colors cursor-pointer space-y-1 ${
              n.read ? 'bg-surface-container/50 border-outline-variant/10 text-outline' : 'bg-surface-container border-outline-variant/20 text-slate-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="font-medium text-slate-100 flex items-center gap-1.5 font-mono text-[11px]">
                {getNotificationIcon(n.type)}
                <span>{n.title}</span>
              </div>
              <span className="text-[10px] text-outline">{n.timestamp}</span>
            </div>
            <p className="text-[11px] leading-relaxed">{n.message}</p>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-10 text-outline text-xs">
            No notifications available.
          </div>
        )}
      </div>
    </div>
  );
};

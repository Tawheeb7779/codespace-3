import React, { useMemo, useState } from 'react';
import { Bell, X, CheckCheck, ShieldAlert, Info, Trash2 } from 'lucide-react';
import { useRuntimeStore } from '../../runtime/RuntimeManager';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Notification types surfaced here; anything noisier stays in the output panel. */
const NOTIFIABLE = new Set(['error', 'stderr']);

/**
 * Notifications are derived from real runtime events rather than a seeded list,
 * so the drawer only ever reports things that actually happened.
 */
export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const logs = useRuntimeStore((s) => s.logs);
  const clearLogs = useRuntimeStore((s) => s.clearLogs);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const notifications = useMemo(
    () => logs.filter((log) => NOTIFIABLE.has(log.type)).slice(-50).reverse(),
    [logs]
  );

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-surface-low border-l border-outline-variant/15 flex flex-col h-full z-40 select-none shadow-2xl">
      <div className="h-11 px-3 bg-surface-container border-b border-outline-variant/15 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
          <Bell className="w-4 h-4 text-primary" />
          <span>NOTIFICATIONS</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary-container text-white font-mono">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setReadIds(new Set(notifications.map((n) => n.id)))}
            className="p-1 hover:text-white text-outline rounded hover:bg-surface-high"
            title="Mark all as read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
          <button
            onClick={clearLogs}
            className="p-1 hover:text-white text-outline rounded hover:bg-surface-high"
            title="Clear runtime log and notifications"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1 hover:text-white text-outline rounded hover:bg-surface-high">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-outline py-10 text-center px-4">
            <Info className="w-6 h-6 opacity-50" />
            <p>No runtime warnings or errors.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = readIds.has(n.id);
            return (
              <button
                key={n.id}
                onClick={() => setReadIds((prev) => new Set(prev).add(n.id))}
                className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                  isRead
                    ? 'bg-surface-container/50 border-outline-variant/10 text-outline'
                    : 'bg-surface-container border-outline-variant/25 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldAlert className={`w-3.5 h-3.5 ${n.type === 'error' ? 'text-red-400' : 'text-amber-400'}`} />
                  <span className="font-medium">{n.type === 'error' ? 'Runtime error' : 'Runtime warning'}</span>
                  <span className="ml-auto text-[10px] font-mono text-outline">{n.timestamp}</span>
                </div>
                <p className="whitespace-pre-wrap break-words leading-relaxed">{n.message}</p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

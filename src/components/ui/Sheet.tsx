import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { usePrefersReducedMotion } from '../../hooks/useBreakpoint';

export type SheetSide = 'bottom' | 'left' | 'right';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: SheetSide;
  title: string;
  /** Bottom sheets size to this fraction of the viewport height. */
  heightRatio?: number;
  /** Side sheets size to this fraction of the viewport width. */
  widthRatio?: number;
  headerAccessory?: React.ReactNode;
  children: React.ReactNode;
}

const HIDDEN: Record<SheetSide, string> = {
  bottom: 'translateY(100%)',
  left: 'translateX(-100%)',
  right: 'translateX(100%)',
};

/**
 * Slide-over surface for the tablet and phone shells.
 *
 * Panels open over the editor rather than shrinking it, which is what keeps the
 * editor usable on a small screen. Escape closes, focus moves into the sheet,
 * and the transition is dropped entirely under prefers-reduced-motion.
 */
export const Sheet: React.FC<SheetProps> = ({
  open,
  onClose,
  side = 'bottom',
  title,
  heightRatio = 0.72,
  widthRatio = 0.86,
  headerAccessory,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Move focus in so keyboard and screen-reader users land on the sheet.
    const id = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(id);
    };
  }, [open, onClose]);

  const isBottom = side === 'bottom';

  const geometry: React.CSSProperties = isBottom
    ? { height: `${Math.round(heightRatio * 100)}dvh`, left: 0, right: 0, bottom: 0 }
    : {
        width: `min(${Math.round(widthRatio * 100)}vw, 420px)`,
        top: 0,
        bottom: 0,
        [side]: 0,
      };

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0, transitionDuration: reducedMotion ? '0ms' : undefined }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{
          ...geometry,
          position: 'absolute',
          transform: open ? 'none' : HIDDEN[side],
          // Keep the closed sheet out of the a11y tree and the tab order.
          visibility: open ? 'visible' : 'hidden',
          transitionDuration: reducedMotion ? '0ms' : '260ms',
          transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
          paddingBottom: isBottom ? 'env(safe-area-inset-bottom)' : undefined,
        }}
        className={`bg-[#09090b] border-white/10 shadow-2xl flex flex-col outline-none transition-[transform,visibility] will-change-transform ${
          isBottom ? 'border-t rounded-t-2xl' : side === 'left' ? 'border-r' : 'border-l'
        }`}
      >
        <header className="h-12 shrink-0 px-3 flex items-center gap-2 border-b border-white/10">
          {isBottom && (
            <span className="absolute left-1/2 -translate-x-1/2 top-1.5 w-9 h-1 rounded-full bg-white/20" />
          )}
          <h2 className="text-[13px] font-semibold text-white tracking-tight">{title}</h2>
          <div className="ml-auto flex items-center gap-1">
            {headerAccessory}
            <button
              onClick={onClose}
              aria-label={`Close ${title}`}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">{open && children}</div>
      </div>
    </div>
  );
};

import React, { useCallback, useRef } from 'react';

interface ResizeHandleProps {
  /** Which edge the handle sits on, i.e. the direction the panel grows. */
  direction: 'horizontal' | 'vertical';
  /** Current size in pixels. */
  size: number;
  onResize: (size: number) => void;
  min: number;
  max: number;
  /** Invert the delta when the panel is anchored to the right/bottom. */
  invert?: boolean;
  onDoubleClick?: () => void;
  label: string;
}

/**
 * Drag handle for a resizable IDE panel.
 *
 * Pointer capture keeps the drag alive over iframes and the Monaco/xterm
 * surfaces, which otherwise swallow the mousemove stream.
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  direction,
  size,
  onResize,
  min,
  max,
  invert = false,
  onDoubleClick,
  label,
}) => {
  const dragState = useRef<{ origin: number; startSize: number } | null>(null);
  const isHorizontal = direction === 'horizontal';

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = { origin: isHorizontal ? e.clientX : e.clientY, startSize: size };
    },
    [isHorizontal, size]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragState.current;
      if (!state) return;
      const current = isHorizontal ? e.clientX : e.clientY;
      const delta = (current - state.origin) * (invert ? -1 : 1);
      onResize(Math.min(max, Math.max(min, state.startSize + delta)));
    },
    [isHorizontal, invert, max, min, onResize]
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  // Keyboard resizing keeps the layout reachable without a pointer.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const decrease = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
      const increase = isHorizontal ? 'ArrowRight' : 'ArrowDown';
      const step = e.shiftKey ? 48 : 16;
      if (e.key !== decrease && e.key !== increase) return;
      e.preventDefault();
      const sign = (e.key === increase ? 1 : -1) * (invert ? -1 : 1);
      onResize(Math.min(max, Math.max(min, size + sign * step)));
    },
    [isHorizontal, invert, max, min, onResize, size]
  );

  return (
    <div
      role="separator"
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
      aria-label={label}
      aria-valuenow={Math.round(size)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      className={`group relative z-20 shrink-0 touch-none transition-colors focus:outline-none ${
        isHorizontal ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize'
      } bg-white/10 hover:bg-[#ef233c]/70 focus-visible:bg-[#ef233c]`}
    >
      {/* Widened hit area without widening the visual seam. */}
      <span
        className={`absolute ${
          isHorizontal ? 'inset-y-0 -left-1 -right-1' : 'inset-x-0 -top-1 -bottom-1'
        }`}
      />
    </div>
  );
};

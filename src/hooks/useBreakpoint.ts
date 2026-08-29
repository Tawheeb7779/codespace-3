import { useEffect, useState } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/** Below this the IDE uses the phone shell; above `TABLET_MAX` the full desktop shell. */
export const MOBILE_MAX = 767;
export const TABLET_MAX = 1024;

function read(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w <= MOBILE_MAX) return 'mobile';
  if (w <= TABLET_MAX) return 'tablet';
  return 'desktop';
}

/**
 * Current device class, driven by matchMedia rather than a resize listener so
 * it only re-renders when the class actually changes.
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(read);

  useEffect(() => {
    const queries = [
      window.matchMedia(`(max-width: ${MOBILE_MAX}px)`),
      window.matchMedia(`(min-width: ${MOBILE_MAX + 1}px) and (max-width: ${TABLET_MAX}px)`),
    ];
    const update = (): void => setBreakpoint(read());
    queries.forEach((q) => q.addEventListener('change', update));
    update();
    return () => queries.forEach((q) => q.removeEventListener('change', update));
  }, []);

  return breakpoint;
}

/** Honours the OS "reduce motion" setting for every animated surface. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (e: MediaQueryListEvent): void => setReduced(e.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}

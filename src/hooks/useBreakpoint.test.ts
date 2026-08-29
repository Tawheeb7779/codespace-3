import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreakpoint, usePrefersReducedMotion, MOBILE_MAX, TABLET_MAX } from './useBreakpoint';

type Listener = () => void;
const listeners = new Set<Listener>();

/** Minimal matchMedia that evaluates the width queries against innerWidth. */
function installMatchMedia(): void {
  window.matchMedia = ((query: string) => {
    const evaluate = (): boolean => {
      const max = /max-width:\s*(\d+)px/.exec(query);
      const min = /min-width:\s*(\d+)px/.exec(query);
      const w = window.innerWidth;
      if (min && max) return w >= Number(min[1]) && w <= Number(max[1]);
      if (max) return w <= Number(max[1]);
      if (min) return w >= Number(min[1]);
      return false;
    };
    return {
      get matches() {
        return evaluate();
      },
      media: query,
      addEventListener: (_: string, cb: Listener) => listeners.add(cb),
      removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
      addListener: (cb: Listener) => listeners.add(cb),
      removeListener: (cb: Listener) => listeners.delete(cb),
      dispatchEvent: () => true,
      onchange: null,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
}

function setWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true });
  act(() => {
    listeners.forEach((cb) => cb());
  });
}

describe('useBreakpoint', () => {
  beforeEach(() => {
    listeners.clear();
    installMatchMedia();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('classifies phones, tablets and desktops', () => {
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true, writable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('mobile');

    setWidth(834);
    expect(result.current).toBe('tablet');

    setWidth(1440);
    expect(result.current).toBe('desktop');
  });

  it('puts both iPad orientations on the touch shell', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true, writable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current, 'iPad portrait').toBe('tablet');

    // 1024 is iPad landscape: it must not fall through to the desktop shell.
    setWidth(1024);
    expect(result.current, 'iPad landscape').toBe('tablet');

    setWidth(1025);
    expect(result.current, 'just past a tablet').toBe('desktop');
  });

  it('treats the exact boundaries as the smaller class', () => {
    Object.defineProperty(window, 'innerWidth', { value: MOBILE_MAX, configurable: true, writable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('mobile');

    setWidth(MOBILE_MAX + 1);
    expect(result.current).toBe('tablet');

    setWidth(TABLET_MAX);
    expect(result.current).toBe('tablet');
  });

  it('reports the reduced-motion preference', () => {
    window.matchMedia = ((query: string) =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true,
        onchange: null,
      }) as unknown as MediaQueryList) as typeof window.matchMedia;

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });
});

import '@testing-library/jest-dom';
/**
 * Guarantees a working Web Storage implementation for tests.
 *
 * Node 22 exposes a global `localStorage` that throws unless the process was
 * started with `--localstorage-file`, and that global shadows the jsdom one.
 * Zustand's persist middleware resolves `localStorage` from the global scope
 * when a store does not supply its own storage - which `useAuthStore` does not -
 * so its writes fail with "Cannot read properties of undefined (reading
 * 'setItem')" or degrade to "the given storage is currently unavailable".
 *
 * Only the test environment is patched; application code is unchanged.
 */
function createMemoryStorage(): Storage {
  const entries = new Map<string, string>();

  return {
    get length(): number {
      return entries.size;
    },
    key(index: number): string | null {
      return Array.from(entries.keys())[index] ?? null;
    },
    getItem(key: string): string | null {
      return entries.has(String(key)) ? (entries.get(String(key)) as string) : null;
    },
    setItem(key: string, value: string): void {
      entries.set(String(key), String(value));
    },
    removeItem(key: string): void {
      entries.delete(String(key));
    },
    clear(): void {
      entries.clear();
    },
  };
}

/** A storage is only usable if a real write/read/delete round-trip succeeds. */
function isUsable(read: () => unknown): boolean {
  try {
    const storage = read() as Storage | null | undefined;
    if (!storage || typeof storage.setItem !== 'function') return false;

    const probe = '__codespace_storage_probe__';
    storage.setItem(probe, '1');
    const roundTripped = storage.getItem(probe) === '1';
    storage.removeItem(probe);
    return roundTripped;
  } catch {
    // Node's experimental global throws on access when no backing file is set.
    return false;
  }
}

function installStorage(name: 'localStorage' | 'sessionStorage'): void {
  const targets: Array<Record<string, unknown>> = [globalThis as unknown as Record<string, unknown>];
  if (typeof window !== 'undefined' && (window as unknown) !== (globalThis as unknown)) {
    targets.push(window as unknown as Record<string, unknown>);
  }

  if (isUsable(() => (globalThis as unknown as Record<string, unknown>)[name])) return;

  const storage = createMemoryStorage();
  for (const target of targets) {
    Object.defineProperty(target, name, {
      value: storage,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }
}

installStorage('localStorage');
installStorage('sessionStorage');

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserPreferences } from '../types';

interface PreferenceState extends UserPreferences {
  /**
   * AI provider credential.
   *
   * Deliberately excluded from persisted state - a long-lived provider key in
   * localStorage is readable by any script that ends up on the page. It lives in
   * memory for the current tab only and must be re-entered after a reload.
   */
  aiApiKey: string;

  customVertexShader: string;
  customFragmentShader: string;

  setTheme: (theme: UserPreferences['theme']) => void;
  setRender3DQuality: (quality: UserPreferences['render3DQuality']) => void;
  setEnable3DWorkspace: (enable: boolean) => void;
  setFontSize: (size: number) => void;
  setWordWrap: (wrap: boolean) => void;
  setAiProvider: (provider: UserPreferences['aiProvider']) => void;
  setAiApiKey: (key: string) => void;
  clearAiApiKey: () => void;
  setCustomShaders: (vertex: string, fragment: string) => void;
}

const DEFAULT_VERTEX_SHADER = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const DEFAULT_FRAGMENT_SHADER = `uniform float uTime;
varying vec2 vUv;
void main() {
  vec3 col = 0.5 + 0.5 * cos(uTime + vUv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(col, 1.0);
}`;

const LEGACY_KEY_FIELD = 'aiApiKey';

/** Removes any provider key written to localStorage by an earlier version. */
function purgeLegacyPersistedKey(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem('codespace-3d-preferences');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.state && LEGACY_KEY_FIELD in parsed.state) {
      delete parsed.state[LEGACY_KEY_FIELD];
      window.localStorage.setItem('codespace-3d-preferences', JSON.stringify(parsed));
    }
  } catch {
    /* corrupt or unavailable storage - nothing to clean */
  }
}

purgeLegacyPersistedKey();

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      theme: 'dark',
      render3DQuality: 'high',
      enable3DWorkspace: true,
      fontSize: 14,
      wordWrap: true,
      aiProvider: 'none',
      aiApiKey: '',
      customVertexShader: DEFAULT_VERTEX_SHADER,
      customFragmentShader: DEFAULT_FRAGMENT_SHADER,

      setTheme: (theme) => set({ theme }),
      setRender3DQuality: (render3DQuality) => set({ render3DQuality }),
      setEnable3DWorkspace: (enable3DWorkspace) => set({ enable3DWorkspace }),
      setFontSize: (fontSize) => set({ fontSize: Math.min(32, Math.max(10, fontSize)) }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setAiProvider: (aiProvider) => set({ aiProvider }),
      setAiApiKey: (aiApiKey) => set({ aiApiKey }),
      clearAiApiKey: () => set({ aiApiKey: '' }),
      setCustomShaders: (customVertexShader, customFragmentShader) =>
        set({ customVertexShader, customFragmentShader }),
    }),
    {
      name: 'codespace-3d-preferences',
      version: 2,
      partialize: (state) => ({
        theme: state.theme,
        render3DQuality: state.render3DQuality,
        enable3DWorkspace: state.enable3DWorkspace,
        fontSize: state.fontSize,
        wordWrap: state.wordWrap,
        aiProvider: state.aiProvider,
        customVertexShader: state.customVertexShader,
        customFragmentShader: state.customFragmentShader,
      }),
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== 'object') return persisted;
        const state = { ...(persisted as Record<string, unknown>) };
        // v1 stored the provider key and a "mock" provider mode.
        delete state[LEGACY_KEY_FIELD];
        if (version < 2 && state.aiProvider === 'mock') state.aiProvider = 'none';
        return state;
      },
    }
  )
);

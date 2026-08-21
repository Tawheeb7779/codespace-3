import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserPreferences } from '../types';

interface PreferenceState extends UserPreferences {
  customVertexShader: string;
  customFragmentShader: string;

  setTheme: (theme: UserPreferences['theme']) => void;
  setRender3DQuality: (quality: UserPreferences['render3DQuality']) => void;
  setEnable3DWorkspace: (enable: boolean) => void;
  setFontSize: (size: number) => void;
  setWordWrap: (wrap: boolean) => void;
  setAiProvider: (provider: UserPreferences['aiProvider']) => void;
  setAiApiKey: (key: string) => void;
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

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      theme: 'dark',
      render3DQuality: 'high',
      enable3DWorkspace: true,
      fontSize: 14,
      wordWrap: true,
      aiProvider: 'mock',
      aiApiKey: '',
      customVertexShader: DEFAULT_VERTEX_SHADER,
      customFragmentShader: DEFAULT_FRAGMENT_SHADER,

      setTheme: (theme) => set({ theme }),
      setRender3DQuality: (render3DQuality) => set({ render3DQuality }),
      setEnable3DWorkspace: (enable3DWorkspace) => set({ enable3DWorkspace }),
      setFontSize: (fontSize) => set({ fontSize }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setAiProvider: (aiProvider) => set({ aiProvider }),
      setAiApiKey: (aiApiKey) => set({ aiApiKey }),
      setCustomShaders: (customVertexShader, customFragmentShader) => set({ customVertexShader, customFragmentShader }),
    }),
    {
      name: 'codespace-3d-preferences',
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserPreferences } from '../types';

interface PreferenceState extends UserPreferences {
  setTheme: (theme: UserPreferences['theme']) => void;
  setRender3DQuality: (quality: UserPreferences['render3DQuality']) => void;
  setEnable3DWorkspace: (enable: boolean) => void;
  setFontSize: (size: number) => void;
  setWordWrap: (wrap: boolean) => void;
  setAiProvider: (provider: UserPreferences['aiProvider']) => void;
  setAiApiKey: (key: string) => void;
}

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

      setTheme: (theme) => set({ theme }),
      setRender3DQuality: (render3DQuality) => set({ render3DQuality }),
      setEnable3DWorkspace: (enable3DWorkspace) => set({ enable3DWorkspace }),
      setFontSize: (fontSize) => set({ fontSize }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setAiProvider: (aiProvider) => set({ aiProvider }),
      setAiApiKey: (aiApiKey) => set({ aiApiKey }),
    }),
    {
      name: 'codespace-3d-preferences',
    }
  )
);

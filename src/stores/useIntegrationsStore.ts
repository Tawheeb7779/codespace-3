import { create } from 'zustand';

export interface IntegrationsState {
  githubConnected: boolean;
  githubUser: string | null;
  vercelConnected: boolean;
  supabaseConnected: boolean;
  nexusAiModel: string;
  voiceControlEnabled: boolean;
  themeMode: 'dark' | 'aether-glass' | 'deep-space';
  reducedMotion: boolean;
  connectGithub: (user: string) => void;
  disconnectGithub: () => void;
  toggleVercel: () => void;
  toggleSupabase: () => void;
  setAiModel: (model: string) => void;
  toggleVoiceControl: () => void;
  setThemeMode: (mode: 'dark' | 'aether-glass' | 'deep-space') => void;
  toggleReducedMotion: () => void;
}

export const useIntegrationsStore = create<IntegrationsState>((set) => ({
  githubConnected: true,
  githubUser: 'tawheeb7779',
  vercelConnected: true,
  supabaseConnected: false,
  nexusAiModel: 'Nexus-3D Ultra (Claude-3.5-Sonnet)',
  voiceControlEnabled: false,
  themeMode: 'aether-glass',
  reducedMotion: false,

  connectGithub: (user) => set({ githubConnected: true, githubUser: user }),
  disconnectGithub: () => set({ githubConnected: false, githubUser: null }),
  toggleVercel: () => set((state) => ({ vercelConnected: !state.vercelConnected })),
  toggleSupabase: () => set((state) => ({ supabaseConnected: !state.supabaseConnected })),
  setAiModel: (model) => set({ nexusAiModel: model }),
  toggleVoiceControl: () => set((state) => ({ voiceControlEnabled: !state.voiceControlEnabled })),
  setThemeMode: (themeMode) => set({ themeMode }),
  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
}));

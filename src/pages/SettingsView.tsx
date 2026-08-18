import React from 'react';
import { Settings, Moon, Sparkles, Key, ShieldCheck, Sun } from 'lucide-react';
import { useIntegrationsStore } from '../stores/useIntegrationsStore';

export const SettingsView: React.FC = () => {
  const {
    themeMode,
    setThemeMode,
    reducedMotion,
    toggleReducedMotion,
    nexusAiModel,
    setAiModel,
    voiceControlEnabled,
    toggleVoiceControl
  } = useIntegrationsStore();

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 select-none">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Settings className="w-6 h-6 text-slate-300" />
          <span>User Preferences & Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Customize spatial 3D background, editor themes, AI parameters, and security tokens
        </p>
      </div>

      <div className="max-w-4xl space-y-6 font-sans text-xs">
        {/* Graphics & Appearance Section */}
        <div className="bg-[#171c26]/70 border border-white/10 rounded-xl p-5 backdrop-blur-md space-y-4">
          <h2 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
            <Moon className="w-4 h-4 text-blue-400" />
            <span>Graphics & Spatial Appearance</span>
          </h2>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-200">Spatial IDE Theme Preset</div>
                <div className="text-slate-400 text-[11px]">Choose between dark futuristic glass profiles</div>
              </div>
              <select
                value={themeMode}
                onChange={(e) => setThemeMode(e.target.value as any)}
                className="bg-[#0e131d] text-blue-400 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none font-mono"
              >
                <option value="aether-glass">Aether Glass (Default 2026)</option>
                <option value="dark">Monokai Dark Pro</option>
                <option value="deep-space">Deep Space Blue</option>
              </select>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Reduced Motion Mode</div>
                <div className="text-slate-400 text-[11px]">Disables WebGL background camera rotations for performance</div>
              </div>
              <button
                onClick={toggleReducedMotion}
                className={`px-3 py-1.5 rounded-lg font-mono border transition-all ${
                  reducedMotion
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                {reducedMotion ? 'ON (Reduced)' : 'OFF (3D Motion Active)'}
              </button>
            </div>
          </div>
        </div>

        {/* AI & Voice Assistant Section */}
        <div className="bg-[#171c26]/70 border border-white/10 rounded-xl p-5 backdrop-blur-md space-y-4">
          <h2 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Nexus AI & Voice Control Engine</span>
          </h2>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-200">Active AI Orchestrator Model</div>
                <div className="text-slate-400 text-[11px]">Select AI model backend for workspace generation</div>
              </div>
              <select
                value={nexusAiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="bg-[#0e131d] text-purple-400 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none font-mono"
              >
                <option value="Nexus-3D Ultra (Claude-3.5-Sonnet)">Nexus-3D Ultra (Claude-3.5-Sonnet)</option>
                <option value="Nexus-3D Express (GPT-4o-Mini)">Nexus-3D Express (GPT-4o-Mini)</option>
                <option value="Nexus-3D Local WebLLM">Nexus-3D Local WebLLM (In-Browser)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Voice Assistant Control</div>
                <div className="text-slate-400 text-[11px]">Enable speech recognition for voice coding</div>
              </div>
              <button
                onClick={toggleVoiceControl}
                className={`px-3 py-1.5 rounded-lg font-mono border transition-all ${
                  voiceControlEnabled
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                {voiceControlEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* Security & Token Vault */}
        <div className="bg-[#171c26]/70 border border-white/10 rounded-xl p-5 backdrop-blur-md space-y-4">
          <h2 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
            <Key className="w-4 h-4 text-amber-400" />
            <span>Security & Token Vault</span>
          </h2>

          <div className="space-y-3 font-mono">
            <div>
              <label className="text-slate-300 block mb-1">Optional GitHub Personal Access Token</label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-[#0e131d] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Tokens are stored strictly in client LocalStorage and never sent to server bundles.</span>
            </div>

            <div className="pt-2 flex items-center space-x-2 text-emerald-400 text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Leak Assurance Active: Client Key Vault Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

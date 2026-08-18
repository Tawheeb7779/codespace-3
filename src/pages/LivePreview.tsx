import React, { useState } from 'react';
import {
  Play,
  RotateCw,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';

export const LivePreview: React.FC = () => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const { files } = useWorkspaceStore();

  const getHtmlContent = () => {
    const appTsx = files.find(f => f.name === 'src')?.children?.find(c => c.name === 'App.tsx');
    const content = appTsx?.content || '<h1>CodeSpace 3D Live Sandbox</h1>';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { background-color: #0e131d; color: #dee2f1; font-family: sans-serif; margin: 0; padding: 2rem; }
          </style>
        </head>
        <body>
          <div id="app">
            <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-xl">
              <span className="text-xs text-blue-400 font-mono font-bold uppercase tracking-widest">LIVE SANDBOX RUNTIME OK</span>
              <div className="mt-2 text-[#dee2f1]">
                ${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const deviceWidths = {
    desktop: 'w-full h-full',
    tablet: 'w-[768px] h-[90%] my-auto shadow-2xl border border-white/20 rounded-xl overflow-hidden',
    mobile: 'w-[375px] h-[80%] my-auto shadow-2xl border border-white/20 rounded-2xl overflow-hidden',
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0e131d] overflow-hidden select-none">
      {/* Top Preview Control Header */}
      <div className="h-11 bg-[#171c26]/90 border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-cyan-400 font-semibold">
            <Play className="w-4 h-4 fill-cyan-400" />
            <span>Sandbox Live Preview</span>
          </div>
          <div className="flex items-center space-x-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>https://localhost:3000 (Protected Iframe)</span>
          </div>
        </div>

        {/* Viewport Device Mode Controls */}
        <div className="flex items-center space-x-1 bg-[#0e131d] border border-white/10 rounded-lg p-1">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded ${device === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded ${device === 'tablet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Tablet View"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded ${device === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Refresh & Expand */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="flex items-center space-x-1 text-xs font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2.5 py-1 rounded transition-colors"
          >
            <RotateCw className="w-3 h-3 text-cyan-400" />
            <span>Refresh</span>
          </button>
          <button className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Preview Screen */}
      <div className="flex-1 bg-[#090e18] flex items-center justify-center p-4 overflow-hidden relative">
        <div className={`transition-all duration-300 bg-[#0e131d] ${deviceWidths[device]}`}>
          <iframe
            key={refreshKey}
            title="Live Sandbox Preview"
            srcDoc={getHtmlContent()}
            className="w-full h-full border-0 bg-[#0e131d]"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
};

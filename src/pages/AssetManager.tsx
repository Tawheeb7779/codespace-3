import React, { useState } from 'react';
import { Boxes, Upload, Search, Trash2, Eye, Image as ImageIcon, Box, Music, Code } from 'lucide-react';
import { useAppStore, Asset3DItem } from '../stores/useAppStore';

export const AssetManager: React.FC = () => {
  const { assets, addAsset, deleteAsset } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Assets' },
    { id: 'models', label: '3D Models' },
    { id: 'textures', label: 'Textures' },
    { id: 'shaders', label: 'GLSL Shaders' },
    { id: 'audio', label: 'Spatial Audio' },
  ];

  const filteredAssets = assets.filter(a => {
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'models': return Box;
      case 'textures': return ImageIcon;
      case 'shaders': return Code;
      case 'audio': return Music;
      default: return Boxes;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-cyan-400" />
            <span>3D Asset & Media Vault</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Organize GLTF models, normal maps, GLSL shaders, and audio clips
          </p>
        </div>

        <button className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-cyan-600/20 font-mono">
          <Upload className="w-4 h-4" />
          <span>Upload 3D Asset</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171c26]/70 p-3 rounded-xl border border-white/10">
        <div className="flex items-center space-x-1 overflow-x-auto py-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 bg-[#0e131d] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 w-full sm:w-64 font-mono">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets..."
            className="bg-transparent focus:outline-none w-full text-slate-100"
          />
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAssets.map((asset) => {
          const Icon = getCategoryIcon(asset.category);
          return (
            <div key={asset.id} className="bg-[#171c26]/70 border border-white/10 hover:border-cyan-500/30 rounded-xl overflow-hidden backdrop-blur-md space-y-3 transition-all group flex flex-col justify-between">
              <div>
                <div className="h-32 bg-[#0e131d] relative overflow-hidden flex items-center justify-center">
                  <img
                    src={asset.previewUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute top-2 left-2 bg-[#0e131d]/80 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 flex items-center space-x-1">
                    <Icon className="w-3 h-3" />
                    <span className="uppercase">{asset.category}</span>
                  </div>
                </div>

                <div className="p-3 space-y-1">
                  <div className="font-bold text-slate-100 text-xs font-mono truncate">{asset.name}</div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{asset.format}</span>
                    <span>{asset.size}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 pt-0 flex items-center justify-between border-t border-white/10 font-mono text-[11px] text-slate-400">
                <span>{asset.updatedAt}</span>
                <div className="flex items-center space-x-1">
                  <button className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-cyan-400">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteAsset(asset.id)} className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

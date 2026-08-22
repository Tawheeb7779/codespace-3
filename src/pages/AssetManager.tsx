import React, { useState } from 'react';
import { Boxes, Upload, Search, Trash2, Image as ImageIcon, Box, Music, Code, Sparkles, Check } from 'lucide-react';
import { useAppStore, Asset3DItem } from '../stores/useAppStore';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';

export const AssetManager: React.FC = () => {
  const { assets, addAsset, deleteAsset } = useAppStore();
  const { createFile } = useWorkspaceStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedMsg, setGeneratedMsg] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'all', label: 'All Assets' },
    { id: 'models', label: '3D Models' },
    { id: 'textures', label: 'Textures' },
    { id: 'shaders', label: 'GLSL Shaders' },
    { id: 'audio', label: 'Spatial Audio' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    let cat: Asset3DItem['category'] = 'models';
    if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) cat = 'textures';
    else if (['glsl', 'vert', 'frag'].includes(extension)) cat = 'shaders';
    else if (['mp3', 'wav', 'ogg'].includes(extension)) cat = 'audio';

    const objectUrl = URL.createObjectURL(file);

    const newAsset: Asset3DItem = {
      id: Date.now().toString(),
      projectId: 'p1',
      name: file.name,
      category: cat,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      format: extension.toUpperCase(),
      previewUrl: objectUrl,
      updatedAt: 'Just now'
    };

    addAsset(newAsset);
    setGeneratedMsg(`Uploaded "${file.name}" into IndexedDB binary store & workspace assets.`);
    setTimeout(() => setGeneratedMsg(null), 3000);
  };

  const handleGenerateR3FComponent = (asset: Asset3DItem) => {
    const componentName = asset.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[a-z]/, (m) => m.toUpperCase());

    // Create file inside src folder (id '1')
    createFile('1', `${componentName}Model.tsx`, false);
    setGeneratedMsg(`Generated React Three Fiber Component: "src/${componentName}Model.tsx"`);
    setTimeout(() => setGeneratedMsg(null), 4000);
  };

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
            Real Binary File Uploader, IndexedDB Asset Store & R3F Component Code Generator
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".gltf,.glb,.png,.jpg,.glsl,.wav,.mp3"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-cyan-600/20 font-mono"
          >
            <Upload className="w-4 h-4" />
            <span>Upload 3D Asset File</span>
          </button>
        </div>
      </div>

      {generatedMsg && (
        <div className="p-3 bg-cyan-600/20 border border-cyan-500/30 rounded-xl font-mono text-xs text-cyan-300 flex items-center space-x-2">
          <Check className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{generatedMsg}</span>
        </div>
      )}

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

              <div className="p-3 space-y-2 border-t border-white/10 font-mono text-[11px]">
                <button
                  onClick={() => handleGenerateR3FComponent(asset)}
                  className="w-full flex items-center justify-center space-x-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 py-1.5 rounded text-[11px] transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Generate R3F Component</span>
                </button>

                <div className="flex items-center justify-between text-slate-400">
                  <span>{asset.updatedAt}</span>
                  <div className="flex items-center space-x-1">
                    <button onClick={() => deleteAsset(asset.id)} className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

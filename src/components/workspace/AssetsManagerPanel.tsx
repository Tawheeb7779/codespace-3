import React, { useState } from 'react';
import {
  FolderArchive,
  Box,
  Image as ImageIcon,
  Music,
  Plus,
  Trash2,
  Copy,
  Check,
  FileCode
} from 'lucide-react';
import { ProjectAsset } from '../../types/stitch';
import { useProjectStore } from '../../store/useProjectStore';

export const AssetsManagerPanel: React.FC = () => {
  const { activeProjectId, projectAssets, setAssetsForProject, createFile, updateFileContent } = useProjectStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterText] = useState<'all' | '3d-model' | 'texture' | 'audio' | 'image'>('all');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState<ProjectAsset['type']>('3d-model');
  const [showAddModal, setShowAddModal] = useState(false);

  const currentProjectId = activeProjectId || 'demo-3d-app';
  const assets = projectAssets[currentProjectId] || [
    { id: '1', name: 'robot_avatar.gltf', type: '3d-model', size: '2.4 MB', url: '/public/assets/robot_avatar.gltf', updatedAt: '2026-02-18' },
    { id: '2', name: 'spatial_grid.png', type: 'texture', size: '512 KB', url: '/public/assets/spatial_grid.png', updatedAt: '2026-02-17' },
  ];

  const handleCopySnippet = (asset: ProjectAsset) => {
    let snippet = '';
    if (asset.type === '3d-model') {
      snippet = `import { useGLTF } from '@react-three/drei';\nconst { scene } = useGLTF('${asset.url}');`;
    } else if (asset.type === 'texture') {
      snippet = `import { useTexture } from '@react-three/drei';\nconst texture = useTexture('${asset.url}');`;
    } else {
      snippet = `const assetUrl = '${asset.url}';`;
    }

    navigator.clipboard.writeText(snippet);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateComponentFromAsset = (asset: ProjectAsset) => {
    const rawName = asset.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const compName = `${rawName}Model.tsx`;
    const codeContent = `import React from 'react';
import { useGLTF } from '@react-three/drei';

export function ${rawName}Model() {
  const { scene } = useGLTF('${asset.url}');
  return <primitive object={scene} scale={1} />;
}
`;
    createFile(compName, 'src', false);
    updateFileContent(compName, codeContent);
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;

    const ext = newAssetType === '3d-model' ? '.gltf' : newAssetType === 'texture' ? '.png' : newAssetType === 'audio' ? '.mp3' : '.svg';
    const cleanName = newAssetName.includes('.') ? newAssetName : `${newAssetName}${ext}`;

    const newAsset: ProjectAsset = {
      id: Date.now().toString(),
      name: cleanName,
      type: newAssetType,
      size: '1.2 MB',
      url: `/public/assets/${cleanName}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newAsset, ...assets];
    setAssetsForProject(currentProjectId, updated);
    setNewAssetName('');
    setShowAddModal(false);
  };

  const handleDeleteAsset = (id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    setAssetsForProject(currentProjectId, updated);
  };

  const filteredAssets = assets.filter((a) => filterType === 'all' || a.type === filterType);

  const getAssetIcon = (type: ProjectAsset['type']) => {
    switch (type) {
      case '3d-model':
        return <Box className="w-4 h-4 text-primary" />;
      case 'texture':
        return <ImageIcon className="w-4 h-4 text-tertiary" />;
      case 'audio':
        return <Music className="w-4 h-4 text-secondary" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface-low text-xs select-none border-r border-outline-variant/15 p-3 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
        <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px] flex items-center gap-2">
          <FolderArchive className="w-4 h-4 text-tertiary" /> ASSETS MANAGER
        </span>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-1 hover:bg-surface-high rounded text-outline hover:text-white transition-colors"
          title="Add Asset"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex bg-surface-container p-0.5 rounded-lg border border-outline-variant/15 text-[11px] overflow-x-auto">
        <button
          onClick={() => setFilterText('all')}
          className={`flex-1 px-2 py-1 rounded font-medium transition-all whitespace-nowrap ${
            filterType === 'all' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
          }`}
        >
          All ({assets.length})
        </button>
        <button
          onClick={() => setFilterText('3d-model')}
          className={`flex-1 px-2 py-1 rounded font-medium transition-all whitespace-nowrap ${
            filterType === '3d-model' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
          }`}
        >
          3D Models
        </button>
        <button
          onClick={() => setFilterText('texture')}
          className={`flex-1 px-2 py-1 rounded font-medium transition-all whitespace-nowrap ${
            filterType === 'texture' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
          }`}
        >
          Textures
        </button>
      </div>

      {/* Asset Cards Grid */}
      <div className="space-y-2">
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-2 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-surface-high border border-outline-variant/20">
                  {getAssetIcon(asset.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 font-mono text-[11px] truncate max-w-[130px]">
                    {asset.name}
                  </h4>
                  <span className="text-[10px] text-outline">{asset.size} • {asset.updatedAt}</span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteAsset(asset.id)}
                className="p-1 hover:text-red-400 text-outline rounded opacity-0 group-hover:opacity-100 transition-all"
                title="Delete asset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-outline-variant/10">
              <button
                onClick={() => handleCopySnippet(asset)}
                className="flex-1 py-1 px-2 bg-surface-high hover:bg-surface-high/80 text-slate-200 rounded text-[10px] font-medium transition-colors flex items-center justify-center gap-1"
              >
                {copiedId === asset.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-outline" />}
                {copiedId === asset.id ? 'Copied Hook' : 'Copy Snippet'}
              </button>

              {asset.type === '3d-model' && (
                <button
                  onClick={() => handleCreateComponentFromAsset(asset)}
                  className="py-1 px-2 bg-primary-container/20 hover:bg-primary-container/30 text-primary rounded text-[10px] font-medium transition-colors flex items-center gap-1 border border-primary/30"
                  title="Generate React Three Fiber Component"
                >
                  <FileCode className="w-3 h-3" /> Gen R3F
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredAssets.length === 0 && (
          <div className="text-center py-8 text-outline space-y-1">
            <Box className="w-8 h-8 opacity-30 mx-auto" />
            <p>No assets found in category.</p>
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-xl p-5 space-y-4 border border-outline-variant/20 shadow-2xl">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-tertiary" /> Register New Workspace Asset
            </h3>

            <form onSubmit={handleAddAsset} className="space-y-3">
              <div>
                <label className="block text-[11px] text-outline mb-1">Asset File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. spaceman_mesh"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] text-outline mb-1">Asset Category</label>
                <select
                  value={newAssetType}
                  onChange={(e) => setNewAssetType(e.target.value as ProjectAsset['type'])}
                  className="w-full px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white"
                >
                  <option value="3d-model">3D Model (.gltf / .glb)</option>
                  <option value="texture">Texture Map (.png / .jpg)</option>
                  <option value="audio">Spatial Audio (.mp3 / .wav)</option>
                  <option value="image">2D Vector / Image (.svg / .png)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-outline hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary-container hover:bg-primary-container/80 text-white rounded font-medium"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

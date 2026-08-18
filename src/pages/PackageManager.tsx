import React, { useState } from 'react';
import { Package, Search, Download, Trash2, ShieldCheck, Plus } from 'lucide-react';
import { useAppStore, PackageItem } from '../stores/useAppStore';

export const PackageManager: React.FC = () => {
  const { packages, installPackage, uninstallPackage } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [newPkgName, setNewPkgName] = useState('');

  const handleInstall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) return;

    const newPkg: PackageItem = {
      name: newPkgName.trim(),
      version: '1.0.0',
      type: 'dependency',
      license: 'MIT',
      vulnerabilityCount: 0,
      description: 'Newly installed spatial npm library',
      downloads: '10k/wk'
    };

    installPackage(newPkg);
    setNewPkgName('');
  };

  const filteredPackages = packages.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Package className="w-6 h-6 text-purple-400" />
            <span>NPM & Package Manager</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Browse, install, and audit project dependencies
          </p>
        </div>

        <form onSubmit={handleInstall} className="flex items-center space-x-2 font-mono text-xs">
          <input
            type="text"
            value={newPkgName}
            onChange={(e) => setNewPkgName(e.target.value)}
            placeholder="npm install package-name"
            className="bg-[#171c26] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500 w-48 sm:w-64"
          />
          <button
            type="submit"
            className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        </form>
      </div>

      <div className="space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between bg-[#171c26]/70 p-3 rounded-xl border border-white/10">
          <div className="flex items-center space-x-2 bg-[#0e131d] border border-white/10 rounded-lg px-3 py-1.5 text-slate-300 w-64">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search installed packages..."
              className="bg-transparent focus:outline-none w-full text-slate-100"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-emerald-400 text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Status: 0 Vulnerabilities</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPackages.map((pkg) => (
            <div key={pkg.name} className="bg-[#171c26]/70 border border-white/10 hover:border-purple-500/30 rounded-xl p-4 backdrop-blur-md space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100 text-sm">{pkg.name}</span>
                    <span className="text-purple-400 font-mono text-xs">v{pkg.version}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${pkg.type === 'devDependency' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                    {pkg.type}
                  </span>
                </div>
                <p className="text-slate-300 font-sans text-xs mt-1">{pkg.description}</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center space-x-3">
                  <span>License: {pkg.license}</span>
                  <span className="flex items-center space-x-1"><Download className="w-3 h-3" /> {pkg.downloads}</span>
                </div>
                <button
                  onClick={() => uninstallPackage(pkg.name)}
                  className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-rose-400 transition-colors"
                  title="Uninstall Package"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

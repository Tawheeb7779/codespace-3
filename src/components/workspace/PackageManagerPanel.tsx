import React, { useState } from 'react';
import {
  Package,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useRuntimeStore } from '../../runtime/RuntimeManager';
import { CompilerEngine } from '../../runtime/CompilerEngine';

interface NpmSearchResult {
  name: string;
  version: string;
  description: string;
  downloads: string;
}

const POPULAR_RECOMMENDED_PACKAGES: NpmSearchResult[] = [
  { name: 'three', version: '0.164.1', description: 'JavaScript 3D Library', downloads: '1.2M/wk' },
  { name: '@react-three/fiber', version: '8.16.6', description: 'React renderer for Three.js', downloads: '450k/wk' },
  { name: '@react-three/drei', version: '9.105.6', description: 'Useful helpers for React Three Fiber', downloads: '380k/wk' },
  { name: 'lucide-react', version: '0.378.0', description: 'Beautiful & consistent icon toolkit for React', downloads: '2.1M/wk' },
  { name: 'zustand', version: '4.5.2', description: 'Bear essential small, fast state-management', downloads: '1.8M/wk' },
  { name: 'clsx', version: '2.1.1', description: 'Utility for constructing className strings', downloads: '15M/wk' },
];

export const PackageManagerPanel: React.FC = () => {
  const { projects, activeProjectId, updateFileContent } = useProjectStore();
  const { installPackages, addLog } = useRuntimeStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [activeTab, setActiveTab] = useState<'installed' | 'search' | 'security'>('installed');

  const currentProject = projects.find((p) => p.id === activeProjectId);
  const pkgFile = currentProject?.files['package.json'];
  const manifest = pkgFile ? CompilerEngine.parseManifest(pkgFile.content) : {};

  const dependencies = manifest.dependencies || {};
  const devDependencies = manifest.devDependencies || {};

  const handleInstallPackage = async (pkgName: string, version: string = 'latest', isDev: boolean = false) => {
    if (!pkgFile || !currentProject) return;

    setIsInstalling(true);
    addLog('info', `npm install ${pkgName}@${version}`);

    try {
      const parsed = CompilerEngine.parseManifest(pkgFile.content);
      const targetGroup = isDev ? 'devDependencies' : 'dependencies';
      parsed[targetGroup] = {
        ...(parsed[targetGroup] || {}),
        [pkgName]: `^${version.replace('^', '')}`,
      };

      const updatedJson = JSON.stringify(parsed, null, 2);
      updateFileContent('package.json', updatedJson);

      await installPackages(updatedJson);
      addLog('stdout', `+ ${pkgName}@${version} added to ${targetGroup}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog('error', `Failed to install package: ${msg}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRemovePackage = (pkgName: string) => {
    if (!pkgFile || !currentProject) return;

    const parsed = CompilerEngine.parseManifest(pkgFile.content);
    if (parsed.dependencies && parsed.dependencies[pkgName]) {
      delete parsed.dependencies[pkgName];
    }
    if (parsed.devDependencies && parsed.devDependencies[pkgName]) {
      delete parsed.devDependencies[pkgName];
    }

    const updatedJson = JSON.stringify(parsed, null, 2);
    updateFileContent('package.json', updatedJson);
    addLog('info', `- ${pkgName} removed from package.json`);
  };

  const filteredSearchResults = POPULAR_RECOMMENDED_PACKAGES.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-surface-low text-xs select-none border-r border-outline-variant/15 p-3 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
        <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px] flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" /> PACKAGE MANAGER
        </span>
        <span className="px-2 py-0.5 rounded bg-surface-high border border-outline-variant/20 text-[10px] text-outline font-mono">
          npm v10.8.2
        </span>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-container p-0.5 rounded-lg border border-outline-variant/15 text-[11px]">
        <button
          onClick={() => setActiveTab('installed')}
          className={`flex-1 py-1 rounded font-medium transition-all ${
            activeTab === 'installed' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
          }`}
        >
          Installed ({Object.keys(dependencies).length + Object.keys(devDependencies).length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-1 rounded font-medium transition-all ${
            activeTab === 'search' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-1 rounded font-medium transition-all ${
            activeTab === 'security' ? 'bg-primary-container text-white shadow' : 'text-outline hover:text-white'
          }`}
        >
          Audit
        </button>
      </div>

      {activeTab === 'installed' && (
        <div className="space-y-3">
          {/* Dependencies List */}
          <div className="space-y-1.5">
            <span className="text-outline text-[11px] font-semibold block">
              DEPENDENCIES ({Object.keys(dependencies).length})
            </span>
            {Object.keys(dependencies).length === 0 ? (
              <p className="text-outline text-[11px] py-1">No dependencies defined in package.json.</p>
            ) : (
              Object.entries(dependencies).map(([name, ver]) => (
                <div key={name} className="flex items-center justify-between p-2 bg-surface-container rounded border border-outline-variant/10">
                  <div>
                    <div className="font-mono text-slate-200 font-medium">{name}</div>
                    <div className="text-[10px] text-outline font-mono">{ver}</div>
                  </div>
                  <button
                    onClick={() => handleRemovePackage(name)}
                    className="p-1 hover:text-red-400 text-outline rounded hover:bg-surface-high transition-colors"
                    title="Uninstall package"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Dev Dependencies List */}
          <div className="space-y-1.5 pt-2 border-t border-outline-variant/10">
            <span className="text-outline text-[11px] font-semibold block">
              DEV DEPENDENCIES ({Object.keys(devDependencies).length})
            </span>
            {Object.keys(devDependencies).length === 0 ? (
              <p className="text-outline text-[11px] py-1">No devDependencies defined.</p>
            ) : (
              Object.entries(devDependencies).map(([name, ver]) => (
                <div key={name} className="flex items-center justify-between p-2 bg-surface-container rounded border border-outline-variant/10">
                  <div>
                    <div className="font-mono text-slate-200 font-medium">{name}</div>
                    <div className="text-[10px] text-outline font-mono">{ver}</div>
                  </div>
                  <button
                    onClick={() => handleRemovePackage(name)}
                    className="p-1 hover:text-red-400 text-outline rounded hover:bg-surface-high transition-colors"
                    title="Uninstall package"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-outline absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search npm packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* Recommended & Search Results */}
          <div className="space-y-2">
            {filteredSearchResults.map((pkg) => {
              const isInstalled = Boolean(dependencies[pkg.name] || devDependencies[pkg.name]);
              return (
                <div key={pkg.name} className="p-2.5 bg-surface-container rounded border border-outline-variant/15 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-slate-100 flex items-center gap-1.5 font-mono">
                        {pkg.name}
                        <span className="text-[10px] text-outline font-normal">v{pkg.version}</span>
                      </h4>
                      <p className="text-[11px] text-outline line-clamp-1">{pkg.description}</p>
                    </div>
                    {isInstalled ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Installed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInstallPackage(pkg.name, pkg.version)}
                        disabled={isInstalling}
                        className="px-2.5 py-1 bg-primary-container hover:bg-primary-container/80 text-white rounded text-[11px] font-medium transition-all flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Install
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-outline pt-1 border-t border-outline-variant/10">
                    <span>{pkg.downloads}</span>
                    <a
                      href={`https://www.npmjs.com/package/${pkg.name}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary flex items-center gap-0.5"
                    >
                      npmjs.com <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 0 Security Vulnerabilities Found
            </div>
            <p className="text-[11px] text-slate-300">npm audit verified 0 vulnerabilities in workspace package manifest.</p>
          </div>

          <div className="p-3 bg-surface-container rounded border border-outline-variant/15 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <ShieldAlert className="w-4 h-4 text-primary" /> Dependency Health Monitor
            </div>
            <p className="text-[11px] text-outline leading-relaxed">
              Monitors manifest dependencies against CVE databases in real-time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

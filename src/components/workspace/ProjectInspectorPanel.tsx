import React, { useMemo } from 'react';
import { FileCode, Folder, Package, GitBranch, Server, HardDrive, AlertTriangle } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useRuntimeStore } from '../../runtime/RuntimeManager';
import { parseManifest } from '../../runtime/manifest';
import { WebContainerProvider } from '../../runtime/WebContainerProvider';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const Row: React.FC<{ label: string; value: React.ReactNode; title?: string }> = ({ label, value, title }) => (
  <div className="flex items-baseline justify-between gap-3 py-1" title={title}>
    <span className="text-zinc-500 shrink-0">{label}</span>
    <span className="text-zinc-200 font-mono text-[11px] truncate text-right">{value}</span>
  </div>
);

/**
 * Read-only view of the real project: counts and sizes are computed from the
 * actual file tree, and runtime facts come from the runtime store.
 */
export const ProjectInspectorPanel: React.FC = () => {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const gitBranch = useProjectStore((s) => s.gitBranch);
  const gitStatus = useProjectStore((s) => s.gitStatus);
  const openFile = useProjectStore((s) => s.openFile);

  const phase = useRuntimeStore((s) => s.phase);
  const serverUrl = useRuntimeStore((s) => s.serverUrl);

  const project = projects.find((p) => p.id === activeProjectId);

  const stats = useMemo(() => {
    if (!project) return null;
    const all = Object.values(project.files);
    const files = all.filter((f) => !f.isFolder);
    const bytes = files.reduce((sum, f) => sum + f.content.length, 0);

    const byExt = new Map<string, number>();
    for (const f of files) {
      const dot = f.name.lastIndexOf('.');
      const ext = dot > 0 ? f.name.slice(dot + 1).toLowerCase() : 'other';
      byExt.set(ext, (byExt.get(ext) ?? 0) + 1);
    }

    const largest = [...files].sort((a, b) => b.content.length - a.content.length).slice(0, 5);
    const manifest = project.files['/package.json']
      ? parseManifest(project.files['/package.json'].content)
      : null;

    return {
      fileCount: files.length,
      folderCount: all.length - files.length,
      bytes,
      unsaved: files.filter((f) => f.isUnsaved).length,
      topExtensions: [...byExt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      largest,
      manifest,
      dependencyCount: manifest
        ? Object.keys(manifest.dependencies || {}).length +
          Object.keys(manifest.devDependencies || {}).length
        : 0,
      scripts: manifest?.scripts ? Object.entries(manifest.scripts) : [],
    };
  }, [project]);

  if (!project || !stats) {
    return <div className="p-3 text-xs text-zinc-500">No project selected.</div>;
  }

  const unsupported = WebContainerProvider.unsupportedReason();

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4 text-xs">
      <section className="space-y-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 text-[#ef233c]" /> Project
        </h3>
        <div className="p-2.5 bg-[#121215] rounded-lg border border-white/10">
          <Row label="Name" value={project.name} />
          <Row label="Files" value={stats.fileCount} />
          <Row label="Folders" value={stats.folderCount} />
          <Row label="Source size" value={formatBytes(stats.bytes)} />
          <Row
            label="Unsaved"
            value={<span className={stats.unsaved ? 'text-amber-400' : 'text-emerald-400'}>{stats.unsaved}</span>}
          />
          {project.githubRepo && <Row label="Repository" value={project.githubRepo} />}
        </div>
      </section>

      <section className="space-y-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-[#ef233c]" /> Source control
        </h3>
        <div className="p-2.5 bg-[#121215] rounded-lg border border-white/10">
          <Row label="Branch" value={gitBranch || 'main'} />
          <Row label="Changed" value={gitStatus.unstaged.length} />
          <Row label="Staged" value={gitStatus.staged.length} />
        </div>
      </section>

      <section className="space-y-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-[#ef233c]" /> Runtime
        </h3>
        <div className="p-2.5 bg-[#121215] rounded-lg border border-white/10">
          <Row label="Phase" value={phase} />
          <Row label="Dev server" value={serverUrl ?? 'not running'} title={serverUrl ?? undefined} />
          {unsupported && (
            <p className="mt-2 text-[10px] text-amber-400 leading-relaxed flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-px" />
              {unsupported}
            </p>
          )}
        </div>
      </section>

      {stats.manifest && (
        <section className="space-y-1">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#ef233c]" /> Manifest
          </h3>
          <div className="p-2.5 bg-[#121215] rounded-lg border border-white/10">
            <Row label="Name" value={stats.manifest.name ?? '—'} />
            <Row label="Dependencies" value={stats.dependencyCount} />
            {stats.scripts.length > 0 && (
              <div className="pt-1.5 mt-1.5 border-t border-white/5 space-y-1">
                {stats.scripts.map(([name, cmd]) => (
                  <div key={name} className="flex items-baseline justify-between gap-2">
                    <span className="text-[#ef233c] font-mono">{name}</span>
                    <span className="text-zinc-500 font-mono text-[10px] truncate" title={cmd}>
                      {cmd}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-[#ef233c]" /> Composition
        </h3>
        <div className="p-2.5 bg-[#121215] rounded-lg border border-white/10 space-y-1.5">
          {stats.topExtensions.map(([ext, count]) => {
            const pct = Math.round((count / Math.max(1, stats.fileCount)) * 100);
            return (
              <div key={ext}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-zinc-400 font-mono">.{ext}</span>
                  <span className="text-zinc-500">{count}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ef233c]/70 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <FileCode className="w-3.5 h-3.5 text-[#ef233c]" /> Largest files
        </h3>
        <div className="p-1 bg-[#121215] rounded-lg border border-white/10">
          {stats.largest.map((f) => (
            <button
              key={f.id}
              onClick={() => openFile(f.id)}
              className="w-full flex items-baseline justify-between gap-2 px-1.5 py-1 rounded hover:bg-white/5 text-left transition-colors"
              title={f.path}
            >
              <span className="truncate text-zinc-300 font-mono text-[11px]">{f.name}</span>
              <span className="text-zinc-500 text-[10px] shrink-0">{formatBytes(f.content.length)}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

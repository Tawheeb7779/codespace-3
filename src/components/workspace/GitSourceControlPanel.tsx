import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  GitBranch,
  Plus,
  Minus,
  Lock,
  CheckCircle2,
  GitCommit,
  Send,
  AlertTriangle,
  ExternalLink,
  Download,
  FolderPlus
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { GitHubPushService, PushResult } from '../../services/GitHubPushService';
import { GitHubImportService, GitHubRepoItem } from '../../services/GitHubImportService';

export const GitSourceControlPanel: React.FC = () => {
  const {
    projects,
    activeProjectId,
    gitBranch,
    gitStatus,
    stageFile,
    unstageFile,
    commitChanges,
    githubConnected,
    githubRepo,
    setGithubConnected,
    setGithubRepo,
    importProject
  } = useProjectStore();

  const [commitMessage, setCommitMessage] = useState('');
  const [lastCommittedMessage, setLastCommittedMessage] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatusText, setPushStatusText] = useState('');
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [sessionToken, setSessionToken] = useState('');

  // Repository listing & import state
  const [repos, setRepos] = useState<GitHubRepoItem[]>([]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === activeProjectId);

  useEffect(() => {
    if (sessionToken && githubConnected) {
      setIsFetchingRepos(true);
      GitHubImportService.fetchRepositories(sessionToken).then((list) => {
        setRepos(list);
        setIsFetchingRepos(false);
      });
    }
  }, [sessionToken, githubConnected]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  /** Confirms the token really works before showing the session as active. */
  const handleVerifyToken = async () => {
    setIsVerifying(true);
    setAuthError(null);
    const verification = await GitHubPushService.verifyToken(sessionToken);
    setIsVerifying(false);

    if (!verification.ok) {
      setGithubLogin(null);
      setGithubConnected(false);
      setAuthError(verification.error || 'Token verification failed.');
      return;
    }
    setGithubLogin(verification.login || null);
    setGithubConnected(true);
  };

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    setLastCommittedMessage(commitMessage.trim());
    commitChanges(commitMessage.trim());
    setCommitMessage('');
  };

  const handleImportSelectedRepo = async () => {
    if (!selectedRepoFullName || !sessionToken) return;

    setIsImporting(true);
    setImportStatusMsg('Reading repository tree from the GitHub REST API...');

    const res = await GitHubImportService.importRepository(
      selectedRepoFullName,
      sessionToken,
      (progress) => setImportStatusMsg(`Downloading ${progress.loaded}/${progress.total}: ${progress.path}`)
    );

    setIsImporting(false);

    if (!res.success || !res.repository) {
      setImportStatusMsg(`Import error: ${res.error}`);
      return;
    }

    const { owner, repo, branch, files, fileCount, skipped, truncated } = res.repository;
    importProject(repo, `Imported from ${owner}/${repo}@${branch}`, files, {
      githubRepo: `${owner}/${repo}`,
      branch,
    });
    setGithubRepo(`${owner}/${repo}`);
    setImportStatusMsg(
      `Imported ${fileCount} files from ${owner}/${repo}@${branch}` +
        (skipped.length ? ` (${skipped.length} skipped: binary, oversized or over the import limit)` : '') +
        (truncated ? '. GitHub truncated the tree, so some files were not listed.' : '')
    );
  };

  const handlePush = async () => {
    if (!githubRepo || !sessionToken) {
      setPushResult({
        success: false,
        error: 'Missing parameters. Enter a valid GitHub Token and repository name.',
      });
      return;
    }

    if (!currentProject || !currentProject.files) {
      setPushResult({
        success: false,
        error: 'No active workspace files available to push.',
      });
      return;
    }

    const confirmed = window.confirm(
      `Push the entire workspace to ${githubRepo}@${gitBranch || 'main'}?\n\n` +
        'Files that exist on the remote branch but not in this workspace will be deleted by the commit.'
    );
    if (!confirmed) return;

    setIsPushing(true);
    setPushResult(null);
    setPushStatusText('Uploading workspace to GitHub...');

    const res = await GitHubPushService.pushChanges(
      sessionToken,
      githubRepo,
      gitBranch || 'main',
      currentProject.files,
      lastCommittedMessage || 'Synchronized workspace files via CodeSpace 3D'
    );

    setIsPushing(false);
    setPushStatusText('');
    setPushResult(res);

    if (res.success && res.sha) {
      const isVerified = await GitHubPushService.verifyRemoteCommit(sessionToken, githubRepo, res.sha);
      if (!isVerified) {
        setPushResult({
          success: false,
          error: 'Remote verification failed: Commit SHA not confirmed by GitHub REST API.',
        });
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface-low text-xs select-none border-r border-outline-variant/15 p-3 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
        <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px] flex items-center gap-2">
          <GitPullRequest className="w-4 h-4 text-[#ef233c]" /> SOURCE CONTROL
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#121215] border border-white/10 font-mono text-[11px]">
          <GitBranch className="w-3 h-3 text-[#ef233c]" /> {gitBranch}
        </div>
      </div>

      {/* GitHub Session State */}
      <div className="p-3 bg-surface-container rounded-xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-200">GitHub Session</span>
          {githubConnected ? (
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
              Session Active
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              Disconnected
            </span>
          )}
        </div>

        {githubRepo && <p className="text-[11px] font-mono text-zinc-400">Repo: {githubRepo}</p>}

        <div className="space-y-1 pt-1">
          <label className="block text-[10px] text-zinc-400">GitHub Personal Token (Session Memory Only)</label>
          <div className="flex gap-1.5">
            <input
              type="password"
              autoComplete="off"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={sessionToken}
              onChange={(e) => {
                setSessionToken(e.target.value);
                setGithubConnected(false);
                setGithubLogin(null);
              }}
              className="flex-1 px-2.5 py-1.5 bg-[#121215] border border-white/10 rounded-lg text-[11px] text-white focus:outline-none focus:border-[#ef233c]/50 font-mono"
            />
            <button
              type="button"
              onClick={handleVerifyToken}
              disabled={!sessionToken.trim() || isVerifying}
              className="px-2.5 py-1.5 bg-[#ef233c] text-white rounded-lg text-[11px] font-semibold disabled:opacity-40 hover:bg-[#d90429] transition-colors"
            >
              {isVerifying ? 'Checking...' : 'Verify'}
            </button>
          </div>
          {githubLogin && (
            <p className="text-[10px] text-emerald-300 font-mono">Authenticated as @{githubLogin}</p>
          )}
          {authError && <p className="text-[10px] text-[#ef233c]">{authError}</p>}
        </div>
      </div>

      {/* Repository Explorer & Import Section */}
      {githubConnected && (
        <div className="p-3 bg-[#121215] rounded-xl border border-white/10 space-y-2">
          <span className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
            <FolderPlus className="w-3.5 h-3.5 text-[#ef233c]" /> Import GitHub Repository
          </span>

          {isFetchingRepos ? (
            <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 border-2 border-zinc-500 border-t-[#ef233c] rounded-full animate-spin" />
              Fetching repository list...
            </div>
          ) : (
            <select
              value={selectedRepoFullName}
              onChange={(e) => setSelectedRepoFullName(e.target.value)}
              className="w-full px-2 py-1.5 bg-[#050507] border border-white/10 rounded-lg text-[11px] text-white focus:outline-none focus:border-[#ef233c]/50"
            >
              <option value="">-- Select GitHub Repository --</option>
              {repos.map((r) => (
                <option key={r.id} value={r.fullName}>
                  {r.fullName} ({r.isPrivate ? 'Private' : 'Public'})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleImportSelectedRepo}
            disabled={!selectedRepoFullName || isImporting}
            className="w-full py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-lg font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#ef233c]" />
            {isImporting ? 'Importing Tree...' : 'Import to Workspace'}
          </button>

          {importStatusMsg && (
            <div className="p-2 rounded bg-surface-container border border-white/10 text-[10px] font-mono text-zinc-300">
              {importStatusMsg}
            </div>
          )}
        </div>
      )}

      {/* Security Disclaimer */}
      <div className="p-2.5 bg-surface-high/60 rounded-lg border border-white/10 text-[11px] text-zinc-400 flex items-start gap-2">
        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p>Tokens are held strictly in ephemeral session memory and passed directly to GitHub REST API endpoints.</p>
      </div>

      {/* Commit & Push Input Box */}
      <form onSubmit={handleCommit} className="space-y-2">
        <textarea
          rows={2}
          placeholder="Commit Message..."
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-[#121215] border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ef233c]/50"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={gitStatus.staged.length === 0}
            className="flex-1 py-1.5 bg-[#ef233c] disabled:opacity-40 hover:bg-[#d90429] text-white rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-red-glow-sm"
          >
            <GitCommit className="w-3.5 h-3.5" /> Commit ({gitStatus.staged.length})
          </button>
          <button
            type="button"
            onClick={handlePush}
            disabled={isPushing}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-[#ef233c]" /> {isPushing ? 'Pushing...' : 'Push'}
          </button>
        </div>

        {isPushing && (
          <div className="p-2 text-[#ef233c] font-mono text-[10px] flex items-center gap-2 bg-[#ef233c]/10 rounded-lg border border-[#ef233c]/30">
            <div className="w-3 h-3 border-2 border-[#ef233c]/30 border-t-[#ef233c] rounded-full animate-spin" />
            <span>{pushStatusText}</span>
          </div>
        )}

        {pushResult && (
          <div className={`p-2.5 rounded-lg text-[11px] space-y-1 border ${
            pushResult.success
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/10 text-red-300 border-red-500/30'
          }`}>
            <div className="font-semibold flex items-center gap-1">
              {pushResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
              {pushResult.success ? 'Remote Push Verified' : 'Push Failed'}
            </div>
            {pushResult.success && (
              <div className="space-y-0.5 font-mono text-[10px]">
                <div>Commit SHA: {pushResult.sha?.slice(0, 7)}</div>
                <div>Branch: {pushResult.branch}</div>
                <div>Files Uploaded: {pushResult.filesUploaded}</div>
                {pushResult.filesDeleted ? <div>Files Deleted: {pushResult.filesDeleted}</div> : null}
                <a
                  href={`https://github.com/${pushResult.repo}/commit/${pushResult.sha}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#ef233c] hover:underline flex items-center gap-1 pt-1 font-semibold"
                >
                  View Commit on GitHub <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
            {!pushResult.success && <p className="text-[10px]">{pushResult.error}</p>}
          </div>
        )}
      </form>

      {/* Staged Changes List */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-zinc-400 text-[11px] font-semibold">
          <span>STAGED CHANGES ({gitStatus.staged.length})</span>
        </div>
        {gitStatus.staged.length === 0 ? (
          <div className="text-zinc-500 text-[11px] py-1">No staged changes</div>
        ) : (
          gitStatus.staged.map((path) => (
            <div key={path} className="flex justify-between items-center py-1 px-2 bg-[#121215] rounded-lg group">
              <span className="truncate font-mono text-emerald-300">{path}</span>
              <button
                onClick={() => unstageFile(path)}
                className="p-1 hover:text-white text-zinc-500"
                title="Unstage File"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Unstaged Changes List */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-zinc-400 text-[11px] font-semibold">
          <span>CHANGES ({gitStatus.unstaged.length})</span>
        </div>
        {gitStatus.unstaged.length === 0 ? (
          <div className="text-zinc-500 text-[11px] py-1">Working tree clean</div>
        ) : (
          gitStatus.unstaged.map((path) => (
            <div key={path} className="flex justify-between items-center py-1 px-2 bg-[#121215] rounded-lg group">
              <span className="truncate font-mono text-amber-300">{path}</span>
              <button
                onClick={() => stageFile(path)}
                className="p-1 hover:text-white text-zinc-500"
                title="Stage File"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

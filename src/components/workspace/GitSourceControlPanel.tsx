import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { GitHubPushService, PushResult } from '../../services/GitHubPushService';

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
    setGithubConnected
  } = useProjectStore();

  const [commitMessage, setCommitMessage] = useState('');
  const [lastCommittedMessage, setLastCommittedMessage] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatusText, setPushStatusText] = useState('');
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [sessionToken, setSessionToken] = useState('');

  const currentProject = projects.find((p) => p.id === activeProjectId);

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    setLastCommittedMessage(commitMessage.trim());
    commitChanges(commitMessage.trim());
    setCommitMessage('');
  };

  const handlePush = async () => {
    if (!githubRepo || !sessionToken) {
      setPushResult({
        success: false,
        error: 'Missing required parameters. Please enter a valid GitHub Token and repository.',
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
      // Verify remote commit via GET /git/commits/{sha}
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
          <GitPullRequest className="w-4 h-4 text-primary" /> SOURCE CONTROL
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-high border border-outline-variant/20 font-mono text-[11px]">
          <GitBranch className="w-3 h-3 text-primary" /> {gitBranch}
        </div>
      </div>

      {/* GitHub Session State */}
      <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 space-y-2">
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

        {githubRepo && <p className="text-[11px] font-mono text-outline">Repo: {githubRepo}</p>}

        <div className="space-y-1 pt-1">
          <label className="block text-[10px] text-outline">GitHub Token (Session Memory Only)</label>
          <input
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={sessionToken}
            onChange={(e) => {
              setSessionToken(e.target.value);
              if (e.target.value) setGithubConnected(true);
            }}
            className="w-full px-2 py-1 bg-surface-high border border-outline-variant/20 rounded text-[11px] text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Security Directive */}
      <div className="p-2.5 bg-surface-high/60 rounded border border-outline-variant/10 text-[11px] text-outline flex items-start gap-2">
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
          className="w-full px-2.5 py-1.5 bg-surface-container border border-outline-variant/20 rounded text-xs text-white placeholder-outline focus:outline-none focus:border-primary"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={gitStatus.staged.length === 0}
            className="flex-1 py-1.5 bg-primary-container disabled:opacity-40 hover:bg-primary-container/80 text-white rounded font-medium text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <GitCommit className="w-3.5 h-3.5" /> Commit ({gitStatus.staged.length})
          </button>
          <button
            type="button"
            onClick={handlePush}
            disabled={isPushing}
            className="px-3 py-1.5 bg-secondary text-slate-950 font-semibold rounded text-xs hover:bg-secondary/90 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> {isPushing ? 'Pushing...' : 'Push'}
          </button>
        </div>

        {isPushing && (
          <div className="p-2 text-primary font-mono text-[10px] flex items-center gap-2 bg-primary/10 rounded border border-primary/20">
            <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span>{pushStatusText}</span>
          </div>
        )}

        {pushResult && (
          <div className={`p-2.5 rounded text-[11px] space-y-1 border ${
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
                  className="text-primary hover:underline flex items-center gap-1 pt-1"
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
        <div className="flex justify-between items-center text-outline text-[11px] font-semibold">
          <span>STAGED CHANGES ({gitStatus.staged.length})</span>
        </div>
        {gitStatus.staged.length === 0 ? (
          <div className="text-outline text-[11px] py-1">No staged changes</div>
        ) : (
          gitStatus.staged.map((path) => (
            <div key={path} className="flex justify-between items-center py-1 px-2 bg-surface-container rounded group">
              <span className="truncate font-mono text-emerald-300">{path}</span>
              <button
                onClick={() => unstageFile(path)}
                className="p-1 hover:text-white text-outline"
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
        <div className="flex justify-between items-center text-outline text-[11px] font-semibold">
          <span>CHANGES ({gitStatus.unstaged.length})</span>
        </div>
        {gitStatus.unstaged.length === 0 ? (
          <div className="text-outline text-[11px] py-1">Working tree clean</div>
        ) : (
          gitStatus.unstaged.map((path) => (
            <div key={path} className="flex justify-between items-center py-1 px-2 bg-surface-container rounded group">
              <span className="truncate font-mono text-amber-300">{path}</span>
              <button
                onClick={() => stageFile(path)}
                className="p-1 hover:text-white text-outline"
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

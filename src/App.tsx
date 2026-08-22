import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

// Lazy-loaded routes for fast non-blocking application start
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const WorkspaceView = lazy(() => import('./pages/Workspace').then(m => ({ default: m.WorkspaceView })));
const TerminalView = lazy(() => import('./pages/TerminalView').then(m => ({ default: m.TerminalView })));
const LivePreview = lazy(() => import('./pages/LivePreview').then(m => ({ default: m.LivePreview })));
const SourceControl = lazy(() => import('./pages/SourceControl').then(m => ({ default: m.SourceControl })));
const GitHubView = lazy(() => import('./pages/GitHubView').then(m => ({ default: m.GitHubView })));
const IntegrationsCenter = lazy(() => import('./pages/IntegrationsCenter').then(m => ({ default: m.IntegrationsCenter })));
const PackageManager = lazy(() => import('./pages/PackageManager').then(m => ({ default: m.PackageManager })));
const AssetManager = lazy(() => import('./pages/AssetManager').then(m => ({ default: m.AssetManager })));
const NexusAIAssistant = lazy(() => import('./pages/NexusAIAssistant').then(m => ({ default: m.NexusAIAssistant })));
const TaskManager = lazy(() => import('./pages/TaskManager').then(m => ({ default: m.TaskManager })));
const AnalyticsView = lazy(() => import('./pages/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const SQLStudio = lazy(() => import('./pages/SQLStudio').then(m => ({ default: m.SQLStudio })));
const SettingsView = lazy(() => import('./pages/SettingsView').then(m => ({ default: m.SettingsView })));

const LoadingFallback: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-[#0e131d] text-blue-400 font-mono text-xs">
    <div className="flex items-center space-x-2 bg-[#171c26] border border-white/10 px-4 py-2 rounded-xl">
      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      <span>Loading CodeSpace Module...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="workspace" element={<WorkspaceView />} />
            <Route path="editor" element={<WorkspaceView />} />
            <Route path="terminal" element={<TerminalView />} />
            <Route path="preview" element={<LivePreview />} />
            <Route path="source-control" element={<SourceControl />} />
            <Route path="github" element={<GitHubView />} />
            <Route path="integrations" element={<IntegrationsCenter />} />
            <Route path="packages" element={<PackageManager />} />
            <Route path="assets" element={<AssetManager />} />
            <Route path="ai" element={<NexusAIAssistant />} />
            <Route path="tasks" element={<TaskManager />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="sql" element={<SQLStudio />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;

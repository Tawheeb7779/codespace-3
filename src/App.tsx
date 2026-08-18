import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

// Page Views
import { Dashboard } from './pages/Dashboard';
import { WorkspaceView } from './pages/Workspace';
import { TerminalView } from './pages/TerminalView';
import { LivePreview } from './pages/LivePreview';
import { SourceControl } from './pages/SourceControl';
import { GitHubView } from './pages/GitHubView';
import { IntegrationsCenter } from './pages/IntegrationsCenter';
import { PackageManager } from './pages/PackageManager';
import { AssetManager } from './pages/AssetManager';
import { NexusAIAssistant } from './pages/NexusAIAssistant';
import { TaskManager } from './pages/TaskManager';
import { AnalyticsView } from './pages/AnalyticsView';
import { SettingsView } from './pages/SettingsView';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
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
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

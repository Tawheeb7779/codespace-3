import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAuthListener } from './store/useAuthStore';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Workspace = React.lazy(() => import('./pages/Workspace'));

export function App() {
  // Restores an existing Supabase session on load and follows sign-in/out.
  useEffect(() => initializeAuthListener(), []);

  return (
    <BrowserRouter>
      <React.Suspense fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#0e131d] text-primary">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="text-sm font-mono tracking-wider">LOADING CODESPACE 3D...</div>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspace/:projectId" element={<Workspace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}

export default App;

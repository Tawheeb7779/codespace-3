import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAuthListener } from './store/useAuthStore';

const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Workspace = React.lazy(() => import('./pages/Workspace'));

export function App() {
  // Restores an existing Supabase session on load and follows sign-in/out.
  useEffect(() => initializeAuthListener(), []);

  return (
    <BrowserRouter>
      <React.Suspense fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#050507] text-[#ef233c]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#ef233c]/30 border-t-[#ef233c] rounded-full animate-spin shadow-red-glow-sm" />
            <div className="text-xs font-mono tracking-widest text-zinc-400">LOADING CODESPACE 3D...</div>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspace/:projectId" element={<Workspace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}

export default App;

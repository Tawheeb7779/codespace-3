import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Gates a route on real auth state. Waits for `authChecked` before deciding
 * anything, so a logged-in user never sees a flash of the sign-in redirect
 * while the session is still being restored.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authChecked = useAuthStore((s) => s.authChecked);
  const location = useLocation();

  if (!authChecked) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#050507]">
        <div className="w-8 h-8 border-2 border-[#ef233c]/30 border-t-[#ef233c] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

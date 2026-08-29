import { useEffect } from 'react';
import { useNavigate, useLocation, type Location } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

/**
 * OAuth redirect target. Supabase's `detectSessionInUrl` (supabaseClient.ts) already
 * exchanges the code in the URL for a session on load - this page only waits for
 * that to land in the store, then forwards to wherever the user was headed.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const authChecked = useAuthStore((s) => s.authChecked);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const error = useAuthStore((s) => s.error);

  const from = (location.state as { from?: Location } | null)?.from;
  const redirectTarget = from ? `${from.pathname}${from.search ?? ''}` : '/dashboard';

  useEffect(() => {
    if (!authChecked) return;
    navigate(isAuthenticated ? redirectTarget : '/signin', { replace: true });
  }, [authChecked, isAuthenticated, navigate, redirectTarget]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-[#050507] text-white">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ef233c] to-[#8d0801] flex items-center justify-center shadow-red-glow-sm">
        <Boxes className="w-5 h-5 text-white" />
      </div>
      <div className="w-6 h-6 border-2 border-[#ef233c]/30 border-t-[#ef233c] rounded-full animate-spin" />
      <p className="text-xs text-zinc-500 font-mono">
        {error ? `Sign-in failed: ${error}` : 'Completing sign-in...'}
      </p>
    </div>
  );
}

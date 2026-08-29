import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link, type Location } from 'react-router-dom';
import { Chrome, Github, Facebook, Twitter, Boxes, AlertCircle } from 'lucide-react';
import { useAuthStore, OAuthProvider } from '../store/useAuthStore';
import { AuthForm } from '../components/auth/AuthForm';
import { CanvasRevealEffect, ShaderBoundary } from '../components/ui/CanvasRevealEffect';
import { useBreakpoint, usePrefersReducedMotion } from '../hooks/useBreakpoint';

const BRAND_RED: number[][] = [[239, 35, 60]];

const OAUTH_PROVIDERS: { id: OAuthProvider; label: string; icon: typeof Github }[] = [
  { id: 'google', label: 'Google', icon: Chrome },
  { id: 'github', label: 'GitHub', icon: Github },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'twitter', label: 'X', icon: Twitter },
];

/**
 * Real OAuth gate: signInWithOAuth redirects the whole page to the provider and
 * back to /auth/callback, which forwards here or to the original destination once
 * a session exists. No fake OTP, no fake success state.
 */
export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signInWithOAuth, error, clearError } = useAuthStore();
  const breakpoint = useBreakpoint();
  const reducedMotion = usePrefersReducedMotion();
  const shaderEnabled = breakpoint !== 'mobile' && !reducedMotion;
  const [oauthPending, setOauthPending] = useState<OAuthProvider | null>(null);

  const from = (location.state as { from?: Location } | null)?.from;
  const redirectTarget = from ? `${from.pathname}${from.search ?? ''}` : '/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTarget, { replace: true });
  }, [isAuthenticated, navigate, redirectTarget]);

  const handleOAuth = async (provider: OAuthProvider) => {
    clearError();
    setOauthPending(provider);
    const started = await signInWithOAuth(provider, `${window.location.origin}/auth/callback`);
    // A successful call navigates the page away immediately; only a synchronous
    // failure (e.g. no backend configured) leaves us here to clear the spinner.
    if (!started) setOauthPending(null);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#e4e4e7] relative overflow-hidden font-sans">
      {shaderEnabled && (
        <div className="fixed inset-0 pointer-events-none">
          <ShaderBoundary>
            <CanvasRevealEffect
              animationSpeed={2}
              colors={BRAND_RED}
              opacities={[0.05, 0.05, 0.08, 0.08, 0.1, 0.1, 0.14, 0.14, 0.18, 0.2]}
              dotSize={breakpoint === 'tablet' ? 5 : 3}
              showGradient={false}
              containerClassName="opacity-40"
            />
          </ShaderBoundary>
        </div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <Link to="/" className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ef233c] to-[#8d0801] flex items-center justify-center shadow-red-glow-sm">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-wider text-white">
            CODESPACE <span className="text-[#ef233c]">3D</span>
          </span>
        </Link>

        <div className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <h1 className="font-display text-xl font-bold text-white">Sign in to continue</h1>
            <p className="text-xs text-zinc-500">Access your workspace and projects.</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {OAUTH_PROVIDERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleOAuth(id)}
                disabled={oauthPending !== null}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef233c]/50"
              >
                <Icon className="w-4 h-4" />
                {oauthPending === id ? 'Redirecting...' : label}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-white/40 text-xs">or</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <AuthForm onSuccess={() => navigate(redirectTarget, { replace: true })} />
        </div>
      </div>
    </div>
  );
}

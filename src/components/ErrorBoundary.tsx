import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level safety net: without this, an unhandled exception anywhere below
 * <Routes> (outside the editor/3D boundaries, which already have their own)
 * unmounts the whole React tree and leaves a blank page.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Unhandled error caught by ErrorBoundary:', error, info.componentStack);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#050507] text-zinc-200 px-6">
        <div className="max-w-md w-full flex flex-col items-center gap-4 text-center">
          <div className="text-[#ef233c] text-sm font-mono tracking-widest">SOMETHING WENT WRONG</div>
          <div className="text-xs text-zinc-500 font-mono break-words whitespace-pre-wrap">
            {error.message || 'An unexpected error occurred.'}
          </div>
          <button
            onClick={this.handleReload}
            className="mt-2 px-4 h-9 rounded-lg bg-[#ef233c] text-white text-[13px] font-semibold hover:bg-[#ef233c]/90 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

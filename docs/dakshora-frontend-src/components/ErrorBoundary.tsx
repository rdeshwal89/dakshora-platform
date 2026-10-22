import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DAKSHORA React ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleHardReload = () => {
    window.location.reload();
  };

  private handleClearStorageAndReload = () => {
    try {
      localStorage.removeItem('dakshora_backend_url');
      localStorage.removeItem('dakshora_auth_token');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-[#0B0F19] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="glass-panel max-w-xl w-full p-8 rounded-3xl border border-rose-500/40 bg-slate-950/90 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/10 animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-wide">
                {this.props.fallbackTitle || 'UI Runtime Exception Intercepted'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                DAKSHORA Error Boundary prevented a black screen crash. All backend data remains safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-rose-500/20 text-left font-mono text-[11px] text-rose-300 max-h-36 overflow-y-auto">
                <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-slate-500 mt-2 overflow-x-auto">
                    {this.state.errorInfo.componentStack.slice(0, 300)}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono inline-flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Recovering View</span>
              </button>

              <button
                onClick={this.handleHardReload}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold font-mono inline-flex items-center gap-2 transition-all"
              >
                <Home className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleClearStorageAndReload}
                className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-bold font-mono inline-flex items-center gap-2 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Reset Cache & Recover</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

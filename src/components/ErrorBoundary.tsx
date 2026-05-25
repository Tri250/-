import React, { Component, ReactNode } from 'react';
import { Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to your analytics service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-effect rounded-3xl p-8 border border-slate-200/50 shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float">
              <Home className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 text-center mb-2">出现了一些问题</h2>
            <p className="text-slate-500 text-center mb-8">
              别担心，这不是你的错。我们的系统已经记录了这个问题。
            </p>
            <div className="space-y-3">
              <button
                onClick={this.resetError}
                className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-cyan-500 text-white font-black rounded-2xl shadow-glow hover:shadow-glow-lg hover:scale-105 transition-all duration-300"
              >
                重新开始
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 px-6 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-colors duration-300"
              >
                刷新页面
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                  查看错误详情
                </summary>
                <pre className="mt-2 p-3 bg-slate-100 rounded-xl text-xs text-slate-600 overflow-x-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

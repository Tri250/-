import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-800 mb-2">出现了一些问题</h2>
            <p className="text-neutral-500 text-sm mb-6">
              应用遇到了一个意外错误，请尝试重试或刷新页面。
            </p>

            {this.state.error && (
              <div className="mb-6">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-1 mx-auto text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {this.state.showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  错误详情
                </button>
                {this.state.showDetails && (
                  <div className="mt-2 p-3 bg-neutral-50 rounded-xl text-left">
                    <p className="text-xs text-red-600 font-mono break-all">{this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="mt-2 text-xs text-neutral-500 font-mono overflow-x-auto max-h-40 overflow-y-auto">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                重试
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export class AsyncErrorBoundary extends ErrorBoundary {
  constructor(props: ErrorBoundaryProps) {
    super(props);
  }
}

export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
): React.FC<P> => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
};

export const logError = (error: Error, context?: string): void => {
  console.error(`[${context || 'App'}] Error:`, error);

  if (typeof window !== 'undefined' && 'localStorage' in window) {
    try {
      const errorLog = JSON.parse(localStorage.getItem('error_log') || '[]');
      errorLog.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        context
      });

      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }

      localStorage.setItem('error_log', JSON.stringify(errorLog));
    } catch {
      console.warn('Failed to log error to localStorage');
    }
  }
};

export const getErrorLog = (): Array<{
  timestamp: string;
  message: string;
  stack?: string;
  context?: string;
}> => {
  try {
    return JSON.parse(localStorage.getItem('error_log') || '[]');
  } catch {
    return [];
  }
};

export const clearErrorLog = (): void => {
  try {
    localStorage.removeItem('error_log');
  } catch {
    console.warn('Failed to clear error log');
  }
};
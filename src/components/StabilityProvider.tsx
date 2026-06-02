import { Component, ReactNode, ErrorInfo } from 'react';
import { stabilityManager, safeExecute } from '../lib/stabilityManager';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  maxRetries?: number;
}

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): AsyncErrorBoundaryState {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    stabilityManager.handleError(error, {
      componentStack: errorInfo.componentStack,
    });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    const { maxRetries = 3, onRetry } = this.props;
    const { retryCount } = this.state;
    
    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        retryCount: retryCount + 1,
      });
      
      if (onRetry) {
        onRetry();
      }
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      const { retryCount } = this.state;
      const { maxRetries = 3 } = this.props;
      const canRetry = retryCount < maxRetries;
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">加载失败</h2>
            <p className="text-neutral-500 text-sm mb-4">
              {this.state.error?.message || '组件加载时发生错误'}
            </p>
            <div className="flex gap-3 justify-center">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  重试 ({retryCount}/{maxRetries})
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
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

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  onOffline?: () => void;
  onOnline?: () => void;
}

interface NetworkErrorBoundaryState {
  isOnline: boolean;
}

export class NetworkErrorBoundary extends Component<NetworkErrorBoundaryProps, NetworkErrorBoundaryState> {
  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = { isOnline: navigator.onLine };
  }

  componentDidMount(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = (): void => {
    this.setState({ isOnline: true });
    this.props.onOnline?.();
  };

  handleOffline = (): void => {
    this.setState({ isOnline: false });
    this.props.onOffline?.();
  };

  render(): ReactNode {
    if (!this.state.isOnline) {
      return (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-3 z-50">
          <div className="max-w-md mx-auto flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <span className="text-sm font-medium">网络连接已断开，请检查网络设置</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface MemoryErrorBoundaryProps {
  children: ReactNode;
  thresholdMB?: number;
  onMemoryWarning?: (usage: number) => void;
}

export class MemoryErrorBoundary extends Component<MemoryErrorBoundaryProps, { hasMemoryWarning: boolean; usage: number }> {
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor(props: MemoryErrorBoundaryProps) {
    super(props);
    this.state = { hasMemoryWarning: false, usage: 0 };
  }

  componentDidMount(): void {
    this.startMemoryCheck();
  }

  componentWillUnmount(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private startMemoryCheck(): void {
    const { thresholdMB = 250, onMemoryWarning } = this.props;
    
    this.checkInterval = setInterval(() => {
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      if (memory) {
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        
        if (usedMB > thresholdMB) {
          this.setState({ hasMemoryWarning: true, usage: Math.round(usedMB) });
          onMemoryWarning?.(usedMB);
          
          this.performCleanup();
        } else {
          this.setState({ hasMemoryWarning: false, usage: Math.round(usedMB) });
        }
      }
    }, 5000);
  }

  private performCleanup(): void {
    console.warn('Memory threshold exceeded, performing cleanup');
    
    safeExecute(() => {
      localStorage.removeItem('temp_data');
      sessionStorage.clear();
    });
  }

  render(): ReactNode {
    return this.props.children;
  }
}

export const withStability = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    maxRetries?: number;
  } = {}
): React.FC<P> => {
  const { fallback, onError, maxRetries = 3 } = options;
  
  return (props: P) => (
    <AsyncErrorBoundary fallback={fallback} onError={onError} maxRetries={maxRetries}>
      <WrappedComponent {...props} />
    </AsyncErrorBoundary>
  );
};

export const StabilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <NetworkErrorBoundary>
      <MemoryErrorBoundary thresholdMB={250}>
        <AsyncErrorBoundary>
          {children}
        </AsyncErrorBoundary>
      </MemoryErrorBoundary>
    </NetworkErrorBoundary>
  );
};
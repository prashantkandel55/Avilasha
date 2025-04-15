import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-6 bg-card border border-border rounded-lg shadow-sm max-w-md mx-auto my-8">
          <h2 className="text-xl font-semibold text-red-500 mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading this component. Please try refreshing the page.
          </p>
          {this.state.error && (
            <div className="p-4 bg-background rounded border border-border text-sm font-mono overflow-auto mb-4">
              <p className="text-destructive">{this.state.error.toString()}</p>
            </div>
          )}
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

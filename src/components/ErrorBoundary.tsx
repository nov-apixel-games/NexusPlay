import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
          return this.props.fallback;
      }
      return (
        <div className="p-8 text-red-500 bg-red-500/10 border border-red-500 rounded-xl m-4 z-50 relative">
          <h1 className="font-bold text-xl mb-4">Application Error</h1>
          <p className="mt-2 text-sm font-mono whitespace-pre-wrap">{this.state.error?.message}</p>
          <p className="mt-2 text-xs font-mono whitespace-pre-wrap">{this.state.error?.stack}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

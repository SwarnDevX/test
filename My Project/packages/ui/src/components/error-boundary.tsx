"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import * as React from "react";

import { Button } from "./button.js";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <DefaultErrorUI error={this.state.error} reset={this.reset} />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorUI({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[oklch(var(--danger-muted))]">
        <AlertTriangle className="h-6 w-6 text-[oklch(var(--danger))]" />
      </div>
      <h3 className="text-sm font-semibold text-[oklch(var(--fg))] mb-1">Something went wrong</h3>
      <p className="text-xs text-[oklch(var(--fg-muted))] max-w-xs mb-4 font-mono">
        {error.message}
      </p>
      <Button size="sm" variant="secondary" onClick={reset} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
        Try again
      </Button>
    </div>
  );
}

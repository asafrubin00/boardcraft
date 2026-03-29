'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReturnToMenu = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy flex flex-col items-center justify-center text-foreground px-6">
          <div className="flex flex-col items-center gap-6 max-w-md text-center">
            {/* Warning icon */}
            <span className="text-6xl" role="img" aria-label="Warning">
              ⚠️
            </span>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gold" style={{ fontFamily: 'Georgia, serif' }}>
              Something went wrong
            </h1>

            {/* Subtitle */}
            <p className="text-foreground/70 font-narrative text-base leading-relaxed">
              An unexpected error occurred. Please try again.
            </p>

            {/* Divider */}
            <div className="w-16 h-px bg-gold/30" />

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                onClick={this.handleReturnToMenu}
                className="w-full sm:w-auto px-8 py-3 bg-gold text-navy-dark font-bold text-sm rounded-lg hover:bg-gold-light transition-all active:scale-[0.97] shadow-lg shadow-gold/20 cursor-pointer"
              >
                Return to Main Menu
              </button>
              <button
                onClick={this.handleTryAgain}
                className="w-full sm:w-auto px-8 py-3 rounded-lg border border-gold/30 text-gold/80 text-sm font-semibold hover:bg-gold/10 hover:text-gold transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>

          {/* Version badge */}
          <div className="absolute bottom-4 right-4 text-foreground/20 text-xs">
            v0.1 prototype
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

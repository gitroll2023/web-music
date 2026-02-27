'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

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
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] dark:bg-[#0f0f0f] px-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
            </div>

            {/* Error message */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">
                문제가 발생했습니다
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                페이지를 표시하는 중 오류가 발생했습니다.
                <br />
                잠시 후 다시 시도해 주세요.
              </p>
            </div>

            {/* Error details (collapsed by default) */}
            {this.state.error && (
              <details className="text-left bg-white/5 rounded-lg p-3">
                <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-400 transition-colors">
                  오류 상세 정보
                </summary>
                <pre className="mt-2 text-red-300/70 text-xs overflow-auto max-h-32 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            {/* Retry button */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="w-full px-6 py-3 bg-[#2C7C98] hover:bg-[#2C7C98]/80 text-white font-medium rounded-xl transition-colors duration-200 active:scale-95"
              >
                다시 시도
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/';
                  }
                }}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/15 text-gray-300 font-medium rounded-xl transition-colors duration-200 active:scale-95"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

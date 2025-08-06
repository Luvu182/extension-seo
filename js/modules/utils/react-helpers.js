'use strict';

import React from 'react';

/**
 * Create a memoized component
 * Since we're not using JSX, we need a helper to apply React.memo
 */
export function createMemoComponent(component, propsAreEqual) {
  return React.memo(component, propsAreEqual);
}

/**
 * Helper to create memoized callbacks
 * Wrapper around React.useCallback for consistency
 */
export function useMemoCallback(callback, deps) {
  return React.useCallback(callback, deps);
}

/**
 * Helper to create memoized values
 * Wrapper around React.useMemo for consistency
 */
export function useMemoValue(factory, deps) {
  return React.useMemo(factory, deps);
}

/**
 * Create an error boundary component
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: {
          padding: '16px',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: '8px',
          margin: '8px'
        }
      }, [
        React.createElement('h3', { 
          key: 'title',
          style: { marginBottom: '8px' }
        }, 'Something went wrong'),
        React.createElement('p', { 
          key: 'message',
          style: { fontSize: '0.875rem' }
        }, this.state.error?.message || 'An unexpected error occurred'),
        React.createElement('button', {
          key: 'retry',
          onClick: () => this.setState({ hasError: false, error: null }),
          style: {
            marginTop: '8px',
            padding: '4px 12px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, 'Try Again')
      ]);
    }

    return this.props.children;
  }
}
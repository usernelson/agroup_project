import React, { Component } from 'react';

/**
 * Error boundary HOC with customizable fallback UI
 * 
 * @param {React.Component} WrappedComponent - Component to wrap with error boundary
 * @param {React.Component} FallbackComponent - Component to render when error occurs
 * @param {Function} [onError] - Optional callback to run when error is caught
 * @returns {React.Component} - Wrapped component with error boundary
 */
const withErrorBoundary = (WrappedComponent, FallbackComponent, onError) => {
  return class WithErrorBoundary extends Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      this.setState({ errorInfo });
      
      // Log error to console
      console.error('Error caught by boundary:', error, errorInfo);
      
      // Call custom error handler if provided
      if (typeof onError === 'function') {
        onError(error, errorInfo, this.props);
      }
    }

    render() {
      if (this.state.hasError) {
        if (FallbackComponent) {
          return <FallbackComponent 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            {...this.props}
          />;
        }
        
        // Default error UI if no fallback provided
        return (
          <div style={{ 
            padding: '20px', 
            margin: '20px', 
            border: '1px solid #f56565',
            borderRadius: '5px',
            backgroundColor: '#fff5f5',
            color: '#c53030'
          }}>
            <h2>Something went wrong</h2>
            <p>{this.state.error && this.state.error.toString()}</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#c53030',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Try Again
            </button>
          </div>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };
};

export default withErrorBoundary;

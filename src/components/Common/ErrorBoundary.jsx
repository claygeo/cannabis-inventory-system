import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Cannabis Inventory System Error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You could also log the error to an error reporting service here
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              The Cannabis Inventory System encountered an unexpected error. 
              This has been logged for investigation.
            </p>
            
            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 text-left">
                <details className="bg-gray-100 p-3 rounded text-xs">
                  <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="font-mono text-red-600 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div className="mt-2 font-mono text-gray-600 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </details>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full btn btn-primary flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Application</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full btn btn-secondary flex items-center justify-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Go to Dashboard</span>
              </button>
            </div>
            
            <div className="mt-6 text-xs text-gray-500">
              Cannabis Inventory System V5.3
              <br />
              Error ID: {Date.now()}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
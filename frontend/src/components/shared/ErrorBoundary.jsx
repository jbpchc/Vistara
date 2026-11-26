import { Component } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
          <div className="bg-white border border-red-200 rounded-2xl shadow-xl max-w-md w-full p-8 text-center anim-fade-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-12">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              System Error
            </h1>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              We encountered an unexpected issue while rendering this page. 
              Please refresh to try again or contact administration if the problem persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-md shadow-red-600/20"
            >
              <RefreshCcw className="w-5 h-5" />
              Reload Application
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 text-left bg-gray-100 p-4 rounded-lg overflow-auto max-h-40">
                <p className="text-xs text-red-600 font-mono font-bold mb-1">{this.state.error.toString()}</p>
                <p className="text-[10px] text-gray-500 font-mono whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

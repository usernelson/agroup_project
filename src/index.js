import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Make sure this file exists in the same directory
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { initializeUserRole } from './utils/roleInitializer';

// Initialize user role at app startup
initializeUserRole();

// Simple error boundary to catch rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          margin: '2rem', 
          backgroundColor: '#fff1f1', 
          border: '1px solid #ff6b6b',
          borderRadius: '8px'
        }}>
          <h2>La aplicación ha encontrado un error</h2>
          <p>Por favor, intenta recargar la página.</p>
          <button onClick={() => window.location.reload()} style={{
            padding: '0.5rem 1rem',
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Remove or comment out reportWebVitals if it's causing problems
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();
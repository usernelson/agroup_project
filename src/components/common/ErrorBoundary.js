import React, { Component } from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  margin: 1rem;
  border-radius: 10px;
  background-color: var(--card-background);
  border: 1px solid var(--error-color);
  color: var(--text-color);
  box-shadow: 0 0 20px var(--card-shadow);
`;

const ErrorHeading = styled.h2`
  color: var(--error-color);
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  margin-bottom: 1.5rem;
  max-width: 500px;
`;

const ResetButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: var(--gradient);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px var(--button-shadow);
  }
`;

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Optionally log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Attempt to recover the application
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/';
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorHeading>¡Ups! Algo salió mal</ErrorHeading>
          <ErrorMessage>
            Se ha producido un error inesperado. Nuestro equipo ha sido notificado.
          </ErrorMessage>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginBottom: '1rem' }}>
              <summary>Detalles del error (solo desarrollo)</summary>
              <p>{this.state.error.toString()}</p>
              <p>{this.state.errorInfo?.componentStack}</p>
            </details>
          )}
          <ResetButton onClick={this.handleReset}>
            Volver al inicio
          </ResetButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

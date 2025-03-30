import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: var(--background-color);
`;

const LoadingText = styled.p`
  margin-top: 1rem;
  color: var(--text-color);
  font-size: 1rem;
`;

const Logo = styled.div`
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
`;

/**
 * Initial loading screen that waits for auth state to be determined
 * before rendering children or redirecting
 */
const InitialLoadingScreen = ({ children }) => {
  const { isAuthenticated, isLoading, authChecked, authError } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  const [showWaitMessage, setShowWaitMessage] = useState(false);
  
  // Set a timeout to ensure we don't show loading indefinitely
  useEffect(() => {
    // Wait for auth to be checked or set a maximum wait time
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 2000);
    
    // After 1.5 seconds, show a wait message to let users know the app is still working
    const waitTimer = setTimeout(() => {
      setShowWaitMessage(true);
    }, 1500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(waitTimer);
    };
  }, []);
  
  // Update loading state when auth is checked
  useEffect(() => {
    if (authChecked) {
      // Check for tokens even if auth check failed
      const hasToken = !!localStorage.getItem('token');
      
      // If we have a token but auth failed, we're likely still in the validation process
      if (hasToken && !isAuthenticated) {
        console.log("[InitialLoadingScreen] Token exists but not authenticated yet, waiting longer");
        
        // Give a bit more time before stopping the loading screen
        setTimeout(() => {
          setLocalLoading(false);
        }, 1000);
      } else {
        // Normal flow - auth checked completely
        setLocalLoading(false);
      }
    }
  }, [authChecked, isAuthenticated]);
  
  // Show loading screen while determining auth state
  if (isLoading || localLoading) {
    return (
      <LoadingContainer>
        <Logo>AGROUP</Logo>
        <LoadingSpinner size="large" />
        <LoadingText>
          {showWaitMessage 
            ? "Verificando sesión, por favor espera..." 
            : "Cargando..."}
        </LoadingText>
        
        {/* Show a nicer message if there's an auth error */}
        {authError && !authError.message.includes('No authentication tokens') && (
          <div style={{ 
            marginTop: '1rem', 
            color: 'var(--error-color)',
            fontSize: '0.9rem',
            maxWidth: '80%',
            textAlign: 'center'
          }}>
            Hubo un problema al verificar tu sesión. Serás redirigido al login.
          </div>
        )}
      </LoadingContainer>
    );
  }
  
  // Render children with auth state
  return children({ isAuthenticated, isLoading });
};

export default InitialLoadingScreen;

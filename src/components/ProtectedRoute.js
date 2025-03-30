import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

const ProtectedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const LoadingMessage = styled.div`
  margin-top: 1rem;
  font-size: 1rem;
  color: var(--text-color);
`;

/**
 * A component that protects routes requiring authentication
 * Redirects to login page if user is not authenticated
 */
const ProtectedRoute = ({ children, roleRequired = null }) => {
  const { isAuthenticated, isLoading, userRole, authChecked } = useAuth();
  const location = useLocation();
  const [waitTime, setWaitTime] = useState(0);
  
  // Effect to add a small timer for very fast connections to avoid flashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setWaitTime(5);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Log auth state for debugging (should be removed in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProtectedRoute] Auth state:', {
        isAuthenticated,
        isLoading,
        authChecked,
        hasToken: !!localStorage.getItem('token'),
        hasRefreshToken: !!localStorage.getItem('refreshToken'),
        userRole
      });
    }
  }, [isAuthenticated, isLoading, authChecked, userRole]);
  
  // If still loading auth state, show loading spinner
  if (isLoading || !authChecked) {
    return (
      <ProtectedContainer>
        <LoadingSpinner size="large" />
        <LoadingMessage>
          {waitTime < 3 ? 'Cargando...' : 'Verificando autenticación...'}
        </LoadingMessage>
      </ProtectedContainer>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Save the current location the user is trying to access
    // So we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Role-based access control
  if (roleRequired && userRole !== roleRequired) {
    // User doesn't have required role, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is authenticated and authorized, render the protected route
  return children;
};

export default ProtectedRoute;

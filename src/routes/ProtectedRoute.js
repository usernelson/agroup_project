import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthSafe } from '../utils/contextHelpers';
import { getSafeUserRole } from '../utils/contextHelpers';

/**
 * ProtectedRoute - Ensures routes are only accessible to authenticated users
 * 
 * @param {Object} props 
 * @param {React.ReactNode} props.children - The components to render if authenticated
 * @param {string[]} [props.allowedRoles] - Optional array of roles allowed to access this route
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, userRole } = useAuthSafe();
  const location = useLocation();
  
  // CRITICAL FIX: Track redirect to prevent loops
  const redirectAttempted = useRef(false);
  const redirectBlockedUntil = useRef(0);
  
  // CRITICAL FIX: Add a check for token existence to supplement isAuthenticated
  const hasToken = (() => {
    try {
      return !!localStorage.getItem('token');
    } catch (e) {
      return false;
    }
  })();
  
  // ENHANCEMENT: Get role from the most reliable source using our utility
  const effectiveRole = userRole || getSafeUserRole();
  
  console.log('[ProtectedRoute] Auth state:', { 
    isAuthenticated, 
    loading, 
    userRole, 
    effectiveRole,
    allowedRoles, 
    hasToken 
  });
  
  // If still loading auth state, show nothing yet
  if (loading) {
    return null;
  }
  
  // CRITICAL FIX: Use token existence as additional auth check
  const effectivelyAuthenticated = isAuthenticated || hasToken;
  
  // Prevent redirect loops with a time-based block
  const now = Date.now();
  if (!effectivelyAuthenticated && 
      !redirectAttempted.current && 
      now > redirectBlockedUntil.current) {
    
    // Mark that we've attempted a redirect to prevent loops
    redirectAttempted.current = true;
    redirectBlockedUntil.current = now + 2000; // Block for 2 seconds
    
    // Check if we're not already at the login page
    if (location.pathname !== '/login') {
      console.log('[ProtectedRoute] Not authenticated, redirecting to login');
      
      // CRITICAL FIX: Add state to Navigate to track where we came from
      return (
        <Navigate 
          to="/login" 
          replace 
          state={{ from: location.pathname }}
        />
      );
    }
  }
  
  // Reset redirect attempt flag once authenticated
  if (effectivelyAuthenticated && redirectAttempted.current) {
    redirectAttempted.current = false;
  }
  
  // Check roles if specified and user is authenticated
  if (effectivelyAuthenticated && allowedRoles && allowedRoles.length > 0) {
    const normalizedRole = effectiveRole ? effectiveRole.toLowerCase() : '';
    const hasRequiredRole = allowedRoles.some(role => 
      normalizedRole === role.toLowerCase()
    );
    
    if (!hasRequiredRole) {
      console.log('[ProtectedRoute] User lacks required role, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

export default ProtectedRoute;
import React from 'react';
import { AuthContext } from '../context/AuthContext';
import authService from '../api/authService'; // Import authService

/**
 * Safe wrapper for useAuth hook that won't throw if context is missing
 * @returns {Object} Auth context or fallback object
 */
export const useAuthSafe = () => {
  try {
    // Try to get the auth context
    const context = React.useContext(AuthContext);
    
    // If context exists, return it
    if (context) {
      return context;
    }
    
    // Log warning and return fallback
    console.warn('[contextHelpers] Auth context not available, using fallback');
    
    // Create a fallback auth object
    return {
      isAuthenticated: !!localStorage.getItem('token'),
      loading: false,
      userRole: localStorage.getItem('userRole') || 'alumno',
      userProfile: null,
      login: async (...args) => {
        console.warn('[contextHelpers] Using direct API login due to missing context');
        return await authService.login(...args);
      },
      logout: async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        window.location.href = '/login?logout=true';
      }
    };
  } catch (error) {
    console.error('[contextHelpers] Error accessing auth context:', error);
    
    // Return minimal fallback object that won't break the app
    return {
      isAuthenticated: !!localStorage.getItem('token'),
      loading: false,
      userRole: localStorage.getItem('userRole') || 'alumno'
    };
  }
};

/**
 * Get user role from most reliable source with cache protection
 */
export const getSafeUserRole = () => {
  try {
    // First check localStorage
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      return storedRole;
    }
    
    // Then try to extract from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          
          // CRITICAL FIX: Add caching with timestamp to prevent repeated extractions
          const tokenRoleCache = sessionStorage.getItem('tokenRoleCache');
          if (tokenRoleCache) {
            try {
              const cache = JSON.parse(tokenRoleCache);
              // Use cache if token is the same and cache is less than 5 minutes old
              if (cache.token === token && (Date.now() - cache.timestamp) < 300000) {
                return cache.role;
              }
            } catch (e) {
              console.warn('[contextHelpers] Error parsing token role cache:', e);
            }
          }
          
          // Extract role from token
          let role = 'alumno'; // Default role
          
          if (payload.resource_access && 
              payload.resource_access.ateacher_client_api_rest && 
              payload.resource_access.ateacher_client_api_rest.roles) {
            
            const roles = payload.resource_access.ateacher_client_api_rest.roles;
            
            if (roles.includes('profesor_client_role')) {
              role = 'profesor';
            } else if (roles.includes('alumno_client_role')) {
              role = 'alumno';
            }
          }
          
          // Cache the result
          sessionStorage.setItem('tokenRoleCache', JSON.stringify({
            token,
            role,
            timestamp: Date.now()
          }));
          
          return role;
        }
      } catch (e) {
        console.warn('[contextHelpers] Error extracting role from token:', e);
      }
    }
    
    return 'alumno'; // Default role
  } catch (e) {
    console.error('[contextHelpers] Error getting user role:', e);
    return 'alumno'; // Default role on error
  }
};

const contextHelpers = {
  useAuthSafe,
  getSafeUserRole,
};
export default contextHelpers; // Assign to a variable before exporting

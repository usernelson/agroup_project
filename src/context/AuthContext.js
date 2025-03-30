import React, { createContext, useState, useEffect } from 'react';
import authService from '../api/authService';
import userService from '../api/userService';
import { debugUserRole } from '../utils/keycloakHelpers';

// Create context directly with createContext
export const AuthContext = createContext();

// Custom hook for using this context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);
  const sessionExpiry = 3600; // Define sessionExpiry with a default value
  const sessionWarningTime = 300; // Define sessionWarningTime with a default value
  
  useEffect(() => {
    // FIXED: Add a flag to track first-time check to prevent auth check loops
    let isFirstCheck = true;
    let authCheckComplete = false;
    
    const checkAuthentication = async () => {
      console.log('[AuthContext] Checking authentication...');
      try {
        // Check for token in localStorage
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        
        // CRITICAL FIX: Always check and use localStorage role to ensure consistency
        const storedRole = localStorage.getItem('userRole');
        if (storedRole && userRole !== storedRole) {
          console.log('[AuthContext] Updating context role from localStorage:', storedRole);
          setUserRole(storedRole);
        }
        
        console.log('[AuthContext] Token check:', { 
          hasToken: !!token, 
          hasRefreshToken: !!refreshToken,
          contextRole: userRole,
          storedRole: storedRole
        });
        
        // ENHANCEMENT: Set authentication based on token presence for first load
        // This reduces the "flashing" between authenticated/unauthenticated states
        if (isFirstCheck && token) {
          setIsAuthenticated(true);
        }
        
        if (!token) {
          console.log('[AuthContext] No tokens found, normal for first visit');
          setIsAuthenticated(false);
          setLoading(false);
          setAuthChecked(true);
          authCheckComplete = true;
          return;
        }

        // ENHANCEMENT: Implement a more resilient token validation approach
        try {
          const validationResult = await authService.validateToken(token);
          console.log('[AuthContext] Token validation success:', validationResult);
          
          // Set authentication state
          setIsAuthenticated(true);
          
          // Try to get profile information
          try {
            const profileFromToken = userService.getUserProfileFromToken(token);
            
            if (profileFromToken) {
              setUserProfile(profileFromToken);
              
              // CRITICAL FIX: Merge role detection results
              const tokenRole = localStorage.getItem('userRole') || profileFromToken.role;
              setUserRole(tokenRole);
              
              console.log('[AuthContext] Profile loaded:', profileFromToken);
              console.log('[AuthContext] Detected user role:', tokenRole);
            } else {
              // Fallback to minimal profile
              const minimalProfile = {
                email: validationResult.email || validationResult.user,
                firstName: validationResult.firstName || '',
                lastName: validationResult.lastName || ''
              };
              setUserProfile(minimalProfile);
              
              // Get role from localStorage
              const storedRole = localStorage.getItem('userRole');
              setUserRole(storedRole || 'alumno');
            }
          } catch (profileError) {
            console.error('[AuthContext] Error loading user data:', profileError);
            
            // Use minimal profile as fallback
            const minimalProfile = {
              email: validationResult.email || validationResult.user,
              firstName: validationResult.firstName || '',
              lastName: validationResult.lastName || ''
            };
            setUserProfile(minimalProfile);
            
            // CRITICAL FIX: Always check localStorage for role
            const storedRole = localStorage.getItem('userRole');
            setUserRole(storedRole || 'alumno');
          }
          
          // Calculate session expiry times
          if (validationResult.exp) {
            // ...existing session expiry code...
          }
        } catch (validationError) {
          console.error('[AuthContext] Token validation failed:', validationError);
          
          // ENHANCEMENT: Only logout for actual auth errors, not network errors
          if (validationError.message && 
              (validationError.message.includes('invalid') || 
               validationError.message.includes('expired') ||
               validationError.message.includes('revoked'))) {
            // This is a genuine auth error, logout
            await logout();
          } else {
            // This might be a network error, keep user logged in but mark as checked
            console.warn('[AuthContext] Token validation failed due to possible network error, keeping user logged in');
            setAuthChecked(true);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Authentication check error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        setAuthChecked(true);
        isFirstCheck = false;
        authCheckComplete = true;
      }
    };

    checkAuthentication();
    
    // Set up token refresh logic
    // ...existing token refresh code...
    
    // ENHANCEMENT: Add a backup check if the initial check takes too long
    const backupTimer = setTimeout(() => {
      if (!authCheckComplete) {
        console.warn('[AuthContext] Auth check taking too long, forcing completion');
        setLoading(false);
        setAuthChecked(true);
      }
    }, 5000); // 5 second timeout
    
    return () => {
      clearTimeout(backupTimer);
      // ...existing cleanup code...
    };
  }, [userRole]);

  // Logout function
  const logout = async () => {
    try {
      console.log('[AuthContext] Logout initiated');
      
      // Try to call the API logout endpoint
      try {
        await authService.logout();
        console.log('[AuthContext] API logout successful');
      } catch (apiError) {
        console.warn('[AuthContext] API logout error:', apiError);
        // Continue with local logout even if API call fails
      }
      
      // Clean up local state
      setIsAuthenticated(false);
      setUserProfile(null);
      setUserRole(null);
      
      // Clear all authentication data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('session_expiry');
      localStorage.removeItem('sessionWarningTime');
      
      // Additional cleanup
      sessionStorage.removeItem('lastLoginRedirect');
      sessionStorage.removeItem('loopDetected');
      sessionStorage.removeItem('lastRoleUpdate');
      sessionStorage.removeItem('recentPathChanges');
      
      console.log('[AuthContext] Logout completed, local state cleared');
      
      // Return success
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      
      // Still clear state on error
      setIsAuthenticated(false);
      setUserProfile(null);
      setUserRole(null);
      
      // Force clean localStorage even on error
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');
      
      throw error;
    }
  };

  // Make sure login function is included in the context value
  const contextValue = {
    isAuthenticated,
    loading,
    userProfile,
    userRole, 
    authChecked,
    logout,
    sessionExpiry,
    sessionWarningTime,
    sessionWarningShown,
    setSessionWarningShown,
    // Login function
    login: async (username, password, otp, rememberMe) => {
      try {
        // Call the service login method
        const result = await authService.login(username, password, otp, rememberMe);
        
        // CRITICAL FIX: Immediately update auth state on successful login
        setIsAuthenticated(true);
        
        if (result.user) {
          setUserProfile(result.user);
          
          // CRITICAL FIX: Save role to localStorage AND state
          const role = result.user.role || 'alumno';
          localStorage.setItem('userRole', role);
          setUserRole(role);
        }
        
        return result;
      } catch (error) {
        console.error('[AuthContext] Login error:', error);
        throw error;
      }
    },
    refreshAuth: async () => {
      try {
        // CRITICAL FIX: Check if refresh token exists before attempting to refresh
        const refreshTokenValue = localStorage.getItem('refreshToken');
        if (!refreshTokenValue) {
          console.warn('[AuthContext] Cannot refresh authentication - no refresh token available');
          
          // Check if we have a token that's still valid
          const token = localStorage.getItem('token');
          if (token) {
            try {
              // Try to validate the existing token
              const isValid = await authService.validateToken(token);
              if (isValid) {
                console.log('[AuthContext] Current token is still valid');
                return { refreshed: false, reason: 'no_refresh_token', currentTokenValid: true };
              }
            } catch (validationError) {
              console.warn('[AuthContext] Current token validation failed:', validationError);
            }
          }
          
          // Return a resolved promise with a status to indicate no refresh occurred
          return { refreshed: false, reason: 'no_refresh_token' };
        }
        
        const refreshResult = await authService.refreshToken();
        
        // Update user profile after refresh if we get new data
        if (refreshResult && refreshResult.userProfile) {
          setUserProfile(refreshResult.userProfile);
        }
        
        // Try to extract user role from the new token
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const parts = token.split('.');
            if (parts.length === 3) {
              // ... role extraction logic ...
            }
          }
        } catch (e) {
          console.warn('[AuthContext] Error extracting role from refreshed token:', e);
        }
        
        return { success: true, refreshed: true };
      } catch (error) {
        console.error('[AuthContext] Error refreshing token:', error);
        
        // ENHANCEMENT: Don't throw error when refresh token is simply missing
        // This allows the app to continue functioning with the existing token
        if (error.message && error.message.includes('No refresh token available')) {
          return { refreshed: false, reason: 'no_refresh_token' };
        }
        
        throw error;
      }
    },
    debugRole: debugUserRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
import React, { createContext, useState, useEffect } from 'react';
import authService from '../api/authService';
import { localStorageService } from '../storage/localStorageService';
import userService from '../api/userService';
import { debugUserRole } from '../utils/keycloakHelpers';

// Crear una instancia única de contexto
export const AuthContext = createContext();

// Crear un hook personalizado para usar este contexto
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [sessionWarningTime, setSessionWarningTime] = useState(null);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);

  useEffect(() => {
    // FIXED: Add a flag to track first-time check to prevent auth check loops
    let isFirstCheck = true;
    
    const checkAuthentication = async () => {
      console.log('[AuthContext] Checking authentication...');
      try {
        // Check for token in localStorage
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        
        console.log('[AuthContext] Token check:', { 
          hasToken: !!token, 
          hasRefreshToken: !!refreshToken 
        });
        
        // Set authentication based on token presence for first load
        // This reduces the "flashing" between authenticated/unauthenticated states
        if (isFirstCheck && token) {
          setIsAuthenticated(true);
        }
        
        if (!token) {
          console.log('[AuthContext] No tokens found, normal for first visit');
          setIsAuthenticated(false);
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        // Validate token (will use the fallback mechanism)
        try {
          const validationResult = await authService.validateToken(token);
          console.log('[AuthContext] Token validation success:', validationResult);
          
          // Set authentication state
          setIsAuthenticated(true);
          
          // Try to get profile information from token or API
          try {
            // Use getUserProfileFromToken instead of getProfile
            const profileFromToken = userService.getUserProfileFromToken(token);
            
            if (profileFromToken) {
              setUser(profileFromToken);
              setUserProfile(profileFromToken);
              setUserRole(profileFromToken.role || 'alumno');
              console.log('[AuthContext] Profile loaded:', profileFromToken);
              console.log('[AuthContext] Detected user role:', profileFromToken.role);
            } else {
              // Fallback to minimal profile from validation result
              const minimalProfile = {
                email: validationResult.email,
                firstName: validationResult.firstName,
                lastName: validationResult.lastName
              };
              console.log('[AuthContext] Using minimal profile:', minimalProfile);
              setUser(minimalProfile);
              setUserProfile(minimalProfile);
              setUserRole(validationResult.userRole || localStorage.getItem('userRole') || 'alumno');
            }
          } catch (profileError) {
            console.error('[AuthContext] Error loading user data:', profileError);
            
            // Use minimal profile as fallback
            const minimalProfile = {
              email: validationResult.email,
              firstName: validationResult.firstName,
              lastName: validationResult.lastName
            };
            console.log('[AuthContext] Using minimal profile:', minimalProfile);
            setUser(minimalProfile);
            setUserProfile(minimalProfile);
            setUserRole(validationResult.userRole || localStorage.getItem('userRole') || 'alumno');
          }
          
          // Calculate and set session expiry times
          if (validationResult.exp) {
            const expiryTime = validationResult.exp * 1000; // Convert to milliseconds
            const warningTime = expiryTime - (5 * 60 * 1000); // 5 minutes before expiry
            
            setSessionExpiry(expiryTime);
            setSessionWarningTime(warningTime);
            
            // Set up a timer for session warning
            const now = Date.now();
            const sessionWarningTimeout = warningTime - now;
            
            if (sessionWarningTimeout > 0) {
              console.log('[AuthContext] Setting session warning timeout for', new Date(warningTime));
              setTimeout(() => {
                setSessionWarningShown(true);
              }, sessionWarningTimeout);
            }
            
            // Set up a timer for session expiry
            const sessionExpiryTimeout = expiryTime - now;
            if (sessionExpiryTimeout > 0) {
              console.log('[AuthContext] Setting session timeout for', new Date(expiryTime));
              setTimeout(() => {
                console.log('[AuthContext] Session expired');
                logout();
              }, sessionExpiryTimeout);
            }
            
            // Log the remaining time
            const minutesRemaining = Math.floor(sessionExpiryTimeout / 60000);
            console.log('[AuthContext] Session will expire in', minutesRemaining, 'minutes');
          }
        } catch (validationError) {
          console.error('[AuthContext] Token validation failed:', validationError);
          // Clean up invalid authentication data
          await logout();
        }
      } catch (error) {
        console.error('[AuthContext] Authentication check error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        setAuthChecked(true);
        isFirstCheck = false;
      }
    };

    checkAuthentication();
    
    // Set up token refresh
    const setupTokenRefresh = () => {
      console.log('[AuthContext] Setting up token refresh timer');
      // Check for token refresh every 5 minutes
      const refreshInterval = setInterval(() => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Decode token to check expiry
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              const currentTime = Math.floor(Date.now() / 1000);
              const timeUntilExpiry = payload.exp - currentTime;
              
              // Refresh if less than 10 minutes until expiry
              if (timeUntilExpiry < 600 && timeUntilExpiry > 0) {
                console.log('[AuthContext] Token will expire soon, refreshing...');
                authService.refreshToken().catch(err => {
                  console.error('[AuthContext] Token refresh failed:', err);
                });
              }
            }
          } catch (e) {
            console.error('[AuthContext] Error checking token expiry:', e);
          }
        }
      }, 5 * 60 * 1000); // Check every 5 minutes
      
      return () => {
        console.log('[AuthContext] Clearing token refresh timer');
        clearInterval(refreshInterval);
      };
    };
    
    const cleanupRefresh = setupTokenRefresh();
    return cleanupRefresh;
  }, []);

  // Rest of the AuthProvider code...
  
  // Login function
  const login = async (username, password, otp, rememberMe) => {
    try {
      const data = await authService.login(username, password, otp, rememberMe);
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Set user profile and role
      if (data.user) {
        setUserProfile(data.user);
        setUserRole(data.user.role || 'alumno');
      }
      
      return data;
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setUserProfile(null);
      setUserRole(null);
      
      // Clear local storage
      localStorageService.clearAuthData();
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      // Still clear user state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      setUserProfile(null);
      setUserRole(null);
      localStorageService.clearAuthData();
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
    // CRITICAL FIX: Make sure login function is included in the context value
    login: authService.login, // Directly expose the auth service login function
    refreshAuth: async () => {
      try {
        const refreshResult = await authService.refreshToken();
        if (refreshResult) {
          return { success: true };
        }
      } catch (error) {
        console.error('[AuthContext] Error refreshing token:', error);
        throw error;
      }
    },
    debugRole: debugUserRole
  };

  return (
    <AuthContext.Provider 
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
};
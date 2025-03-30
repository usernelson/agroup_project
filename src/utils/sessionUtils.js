/**
 * Session Management Utilities
 * 
 * This module provides helper functions for managing user sessions:
 * - Session monitoring and debugging
 * - Authentication state helpers
 * - Token management
 * - Session timeout detection
 */

/**
 * Debug function to log session-related events with timestamps
 * 
 * @param {string} message - The message to log
 * @param {any} data - Optional data to include in the log
 */
export const logSessionEvent = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] SESSION: ${message}`;
  
  if (data) {
    console.log(formattedMessage, data);
  } else {
    console.log(formattedMessage);
  }
};

/**
 * Monitor navigation events for debugging session issues
 * 
 * Sets up event listeners and localStorage monitoring
 * to help debug session-related issues.
 */
export const startSessionMonitoring = () => {
  // Listen for navigation events
  window.addEventListener('popstate', () => {
    logSessionEvent(`Navigation - ${window.location.pathname}`);
  });
  
  // Monitor localStorage changes related to auth
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    if (['token', 'refreshToken', 'userRole', 'session_expiry'].includes(key)) {
      const valueToLog = typeof value === 'string' && value.length > 20 
        ? `${value.substring(0, 10)}...` 
        : value;
      logSessionEvent(`localStorage.setItem('${key}', '${valueToLog}')`);
    }
    originalSetItem.apply(this, arguments);
  };
  
  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function(key) {
    if (['token', 'refreshToken', 'userRole', 'session_expiry'].includes(key)) {
      logSessionEvent(`localStorage.removeItem('${key}')`);
    }
    originalRemoveItem.apply(this, arguments);
  };
  
  // Monitor authentication errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('authentication') || 
         args[0].includes('token') || 
         args[0].includes('login') || 
         args[0].includes('logout'))) {
      logSessionEvent(`Error - ${args[0]}`);
    }
    originalConsoleError.apply(this, arguments);
  };
};

/**
 * Check if user is in the process of logging out
 * 
 * @returns {boolean} True if logout is in progress
 */
export const isLoggingOut = () => {
  return !!window.loggingOut;
};

/**
 * Safely clear all authentication data
 * 
 * Removes all authentication-related data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('session_expiry');
  logSessionEvent('Auth data cleared');
};

/**
 * Check if session is about to expire
 * 
 * @param {number} warningThreshold - Seconds before expiry to return true
 * @returns {boolean} True if session is about to expire
 */
export const isSessionExpiring = (warningThreshold = 300) => { // Default 5 minutes
  const expiry = localStorage.getItem('session_expiry');
  if (!expiry) return false;
  
  const expiryTime = parseInt(expiry, 10) * 1000; // Convert to milliseconds
  const now = Date.now();
  const timeLeft = expiryTime - now;
  
  return timeLeft > 0 && timeLeft < warningThreshold * 1000;
};

/**
 * Check if session is about to expire
 * 
 * @param {number} warningThreshold - Seconds before expiry to return true
 * @returns {boolean} True if session is about to expire
 */
export const isAboutToExpire = (warningThreshold = 300) => {
  const expiryTime = localStorage.getItem('session_expiry');
  if (!expiryTime) return false;
  
  const expiryTimestamp = parseInt(expiryTime, 10) * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const timeRemaining = expiryTimestamp - currentTime;
  
  // Return true if session will expire within the warning threshold
  return timeRemaining > 0 && timeRemaining < warningThreshold * 1000;
};

/**
 * Get the remaining time until session expiry
 * 
 * @returns {number} Seconds until session expiry, or 0 if expired/not set
 */
export const getSessionTimeRemaining = () => {
  const expiryTime = localStorage.getItem('session_expiry');
  if (!expiryTime) return 0;
  
  const expiryTimestamp = parseInt(expiryTime, 10) * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const timeRemaining = expiryTimestamp - currentTime;
  
  return Math.max(0, Math.floor(timeRemaining / 1000));
};

/**
 * Check if the session has expired
 * 
 * @returns {boolean} True if the session has expired or no expiry info exists
 */
export const hasSessionExpired = () => {
  const expiryTime = localStorage.getItem('session_expiry');
  if (!expiryTime) return true; // No expiry time means we can't verify session validity
  
  const expiryTimestamp = parseInt(expiryTime, 10) * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  
  return currentTime >= expiryTimestamp;
};

/**
 * Format the remaining session time into a human-readable string
 * 
 * @returns {string} Formatted time string (e.g., "5m 30s")
 */
export const formatSessionTimeRemaining = () => {
  const seconds = getSessionTimeRemaining();
  if (seconds <= 0) return "Expirado";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}m ${remainingSeconds}s`;
};

// Removed duplicate implementation of getSessionTimeRemaining to avoid re-declaration error.

/**
 * Format remaining session time as readable string
 * 
 * @returns {string} Formatted time remaining (e.g., "15m 30s")
 */
export const getFormattedSessionTime = () => {
  try {
    const expiryTimestamp = parseInt(localStorage.getItem('session_expiry') || '0', 10);
    if (!expiryTimestamp) return 'Unknown';
    
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = expiryTimestamp - now;
    
    if (timeRemaining <= 0) return 'Expired';
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  } catch (error) {
    console.error('Error calculating session time:', error);
    return 'Unknown';
  }
};

/**
 * Detect if browser supports session storage
 * 
 * @returns {boolean} True if session storage is supported
 */
export const isSessionStorageSupported = () => {
  try {
    const testKey = '__test_storage__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Enhance localStorage to log and catch errors
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return null;
    }
  },
  
  setItem: (key, value) => {
    try {
      console.log(`[${new Date().toISOString()}] SESSION: localStorage.setItem('${key}', '${key === 'token' || key === 'refreshToken' ? 'eyJhbGciOi...' : value}')`);
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing from localStorage:', e);
    }
  }
};

// Get user role with consistent behavior
export const getUserRole = () => {
  // First try normal localStorage
  const storedRole = safeLocalStorage.getItem('userRole');
  if (storedRole) {
    return storedRole.toLowerCase();
  }
  
  // Fall back to token examination
  const token = safeLocalStorage.getItem('token');
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        
        // Check for role information in token
        if (payload.resource_access && 
            payload.resource_access.ateacher_client_api_rest && 
            payload.resource_access.ateacher_client_api_rest.roles) {
          
          const roles = payload.resource_access.ateacher_client_api_rest.roles;
          
          if (roles.includes('profesor_client_role')) {
            // Make sure to store this for next time
            safeLocalStorage.setItem('userRole', 'profesor');
            return 'profesor';
          } else if (roles.includes('alumno_client_role')) {
            safeLocalStorage.setItem('userRole', 'alumno');
            return 'alumno';
          }
        }
      }
    } catch (e) {
      console.warn('Error extracting role from token:', e);
    }
  }
  
  // Default to alumno
  return 'alumno';
};

/**
 * Handle login redirect after successful authentication
 * 
 * @param {string} destination - Path to redirect to
 * @param {boolean} replace - Whether to replace current history entry
 */
export const handleLoginRedirect = (destination = '/dashboard', replace = true) => {
  // Clear any conflicting session states
  localStorage.removeItem('redirectPending');
  
  // Use the improved navigation method
  safeLocationNavigate(destination, replace);
};

/**
 * Clear session and redirect to login page
 */
export const clearSessionAndRedirect = () => {
  try {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Don't clear userRole as it might be useful for the login screen
    
    // Add logout parameter to URL
    safeLocationNavigate('/login?logout=true', true);
  } catch (e) {
    console.error('[SessionUtils] Error clearing session:', e);
    
    // Force redirect even if error occurs
    window.location.href = '/login?logout=true&error=true';
  }
};

/**
 * Check if the current session is healthy by validating the token
 * @returns {Promise<boolean>} - Whether the session is healthy
 */
export const checkSessionHealth = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Perform a simple decode to check expiry
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const expiry = payload.exp * 1000; // Convert to ms
    const now = Date.now();
    
    // If token is expired or will expire in less than 2 minutes
    if (expiry < now + 120000) {
      console.log('[SessionUtils] Token expired or expiring soon, attempting refresh');
      
      // Try to refresh the token
      try {
        const { refreshToken } = await import('../api/authService');
        await refreshToken();
        return true;
      } catch (e) {
        console.error('[SessionUtils] Token refresh failed:', e);
        return false;
      }
    }
    
    return true;
  } catch (e) {
    console.error('[SessionUtils] Error checking session health:', e);
    return false;
  }
};

// Export consistent utils
export default {
  getFormattedSessionTime,
  isAboutToExpire,
  getUserRole,
  localStorage: safeLocalStorage,
  checkSessionHealth,
  handleLoginRedirect,
  clearSessionAndRedirect
};

// Initialize monitoring in development mode
if (process.env.NODE_ENV === 'development') {
  startSessionMonitoring();
}

import { localStorageService } from '../storage/localStorageService';

/**
 * Centralized authentication utilities to avoid duplicate logic
 * across components like Header, MobileNavigation, and Dashboard
 */

/**
 * @typedef {Object} AuthData
 * @property {string} [token] - Authentication token
 * @property {string} [access_token] - Alternative name for auth token
 * @property {string} [refresh_token] - Refresh token
 * @property {number} [exp] - Token expiration timestamp
 * @property {string} [role] - User role
 */

/**
 * Stores authentication data in local storage
 * @param {AuthData} data - Authentication data from server
 * @returns {boolean} - Whether tokens were successfully stored
 */
export const storeAuthData = (data) => {
  let success = true;
  
  // Store tokens
  if (data.token) {
    success = localStorageService.setAuthToken(data.token) && success;
  } else if (data.access_token) {
    success = localStorageService.setAuthToken(data.access_token) && success;
  }
  
  if (data.refresh_token) {
    success = localStorageService.setRefreshToken(data.refresh_token) && success;
  }
  
  if (data.exp) {
    success = localStorageService.setSessionExpiry(data.exp) && success;
  }
  
  // Store user role if available
  if (data.role) {
    success = localStorageService._secureSet('userRole', data.role) && success;
  }
  
  return success && verifyTokensStored();
};

/**
 * Verifies if tokens are stored in local storage
 * @returns {boolean} - Whether at least one token is stored
 */
export const verifyTokensStored = () => {
  const authToken = localStorageService.getAuthToken();
  const refreshToken = localStorageService.getRefreshToken();
  
  return !!authToken || !!refreshToken;
};

/**
 * Clears all authentication data
 * @returns {boolean} - Whether the operation was successful
 */
export const clearAuthData = () => {
  let success = true;
  
  // Clear auth-related data from localStorage
  success = localStorageService.clearAuthToken() && success;
  success = localStorageService.setRefreshToken(null) && success;
  success = localStorageService.setSessionExpiry(null) && success;
  
  // Also clear userRole
  try {
    localStorage.removeItem('userRole');
  } catch (e) {
    console.warn("Could not clear userRole:", e);
    success = false;
  }
  
  // Clear session storage
  try {
    sessionStorage.clear();
  } catch (e) {
    console.warn("Could not clear sessionStorage:", e);
    success = false;
  }
  
  // Clear cookie flags
  try {
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  } catch (e) {
    console.warn("Could not clear cookies:", e);
    success = false;
  }
  
  return success;
};

/**
 * Check if auth tokens are expired
 * @returns {boolean} - Whether tokens are expired or not
 */
export const isSessionExpired = () => {
  return localStorageService.isTokenExpired();
};

/**
 * Handle logout process with visual feedback
 * @param {Function} logoutFunction - Logout function from AuthContext
 * @param {Function} [navigate] - React Router navigate function
 * @returns {Promise<void>}
 */
export const handleLogout = async (logoutFunction, navigate) => {
  // Prevent multiple logout attempts
  if (window.loggingOut) {
    console.log("Logout already in progress");
    return;
  }
  
  // Set flag
  window.loggingOut = true;
  
  // Create a feedback element
  const feedbackElement = showLogoutFeedback();
  
  try {
    // Execute logout function
    await logoutFunction();
    
    // Add success message to feedback
    updateLogoutFeedback(feedbackElement, 'Sesión cerrada correctamente');
    
    // Explicit redirect to login
    setTimeout(() => {
      if (navigate) {
        navigate('/login?logout=true');
      } else {
        window.location.href = '/login?logout=true';
      }
    }, 800); // Give time to see the success message
  } catch (error) {
    console.error('Error during logout:', error);
    
    // Update feedback with error
    updateLogoutFeedback(feedbackElement, 'Error al cerrar sesión', true);
    
    // Clear flag and redirect even on error
    window.loggingOut = false;
    
    setTimeout(() => {
      window.location.href = '/login?error=' + encodeURIComponent('Error al cerrar sesión');
    }, 2000);
  }
};

/**
 * Helper function for visual feedback during logout
 * @returns {HTMLElement} - The created feedback element
 */
const showLogoutFeedback = () => {
  // Remove any existing feedback first
  const existingFeedback = document.getElementById('logout-feedback');
  if (existingFeedback) {
    document.body.removeChild(existingFeedback);
  }

  const userFeedback = document.createElement('div');
  userFeedback.id = 'logout-feedback';
  userFeedback.style.position = 'fixed';
  userFeedback.style.top = '50%';
  userFeedback.style.left = '50%';
  userFeedback.style.transform = 'translate(-50%, -50%)';
  userFeedback.style.padding = '20px';
  userFeedback.style.backgroundColor = 'rgba(0,0,0,0.8)';
  userFeedback.style.color = 'white';
  userFeedback.style.borderRadius = '10px';
  userFeedback.style.zIndex = '9999';
  userFeedback.style.minWidth = '220px';
  userFeedback.style.textAlign = 'center';
  userFeedback.style.transition = 'all 0.3s ease';
  userFeedback.style.fontSize = '16px';
  
  // Add spinning animation
  const spinner = document.createElement('div');
  spinner.style.borderRadius = '50%';
  spinner.style.width = '30px';
  spinner.style.height = '30px';
  spinner.style.margin = '0 auto 15px auto';
  spinner.style.border = '3px solid rgba(255, 255, 255, 0.3)';
  spinner.style.borderTopColor = 'white';
  spinner.style.animation = 'spin 1s linear infinite';
  userFeedback.appendChild(spinner);
  
  // Add keyframe animation for spinner
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
  
  // Add message
  const message = document.createElement('div');
  message.textContent = 'Cerrando sesión...';
  userFeedback.appendChild(message);
  
  document.body.appendChild(userFeedback);
  return userFeedback;
};

/**
 * Update the logout feedback message
 * @param {HTMLElement} element - The feedback element
 * @param {string} message - New message to display
 * @param {boolean} [isError=false] - Whether this is an error message
 */
const updateLogoutFeedback = (element, message, isError = false) => {
  if (!element) return;
  
  // Update the message text
  const messageElement = element.querySelector('div:not([style*="animation"])');
  if (messageElement) {
    messageElement.textContent = message;
  }
  
  // Replace spinner with success or error icon
  const spinner = element.querySelector('div[style*="animation"]');
  if (spinner) {
    const icon = document.createElement('div');
    
    if (isError) {
      // Red background for error
      element.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
      
      // Error X symbol
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    } else {
      // Green background for success
      element.style.backgroundColor = 'rgba(40, 167, 69, 0.9)';
      
      // Checkmark symbol
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    }
    
    // Replace spinner with icon
    element.replaceChild(icon, spinner);
  }
};

/**
 * Check if the current session needs refresh
 * @returns {boolean} - Whether the session should be refreshed
 */
export const shouldRefreshSession = () => {
  // Get expiry time
  const expiry = localStorageService.getSessionExpiry();
  if (!expiry) return false;
  
  const expiryTime = parseInt(expiry, 10) * 1000;
  const now = Date.now();
  
  // If expiry is less than 5 minutes away, it's time to refresh
  return (expiryTime - now) < (5 * 60 * 1000) && (expiryTime - now) > 0;
};

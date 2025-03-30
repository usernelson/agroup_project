/**
 * Navigation utility to safely handle direct location navigation
 * This prevents redirect loops by tracking recent navigations
 */

// Store the most recent navigation timestamps
const recentNavigations = new Map();

/**
 * Navigate using window.location with protection against loops
 * 
 * @param {string} path - Target path to navigate to
 * @param {boolean} replace - Whether to use location.replace (true) or location.href (false)
 * @param {number} minInterval - Minimum time in ms between identical navigations
 * @returns {boolean} - Whether navigation was performed
 */
export const safeLocationNavigate = (path, replace = true, minInterval = 2000) => {
  const now = Date.now();
  const lastNav = recentNavigations.get(path) || 0;
  
  // Prevent navigation to the same path if too recent
  if (now - lastNav < minInterval) {
    console.warn(`[Navigation] Prevented loop to ${path} - too soon since last navigation`);
    return false;
  }
  
  // Record this navigation
  recentNavigations.set(path, now);
  
  // Clean up old entries to prevent memory leak
  if (recentNavigations.size > 10) {
    const oldestKey = [...recentNavigations.keys()][0];
    recentNavigations.delete(oldestKey);
  }
  
  // Perform the navigation
  if (replace) {
    window.location.replace(path);
  } else {
    window.location.href = path;
  }
  
  return true;
};

/**
 * Debug the current navigation state
 */
export const debugNavigation = () => {
  console.group('🧭 Navigation Debug');
  console.log('Current path:', window.location.pathname);
  console.log('Recent navigations:', [...recentNavigations.entries()]);
  console.groupEnd();
};

export default {
  safeLocationNavigate,
  debugNavigation
};

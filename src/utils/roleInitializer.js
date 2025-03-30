/**
 * Role Initializer
 * 
 * This utility ensures that user roles are properly initialized and
 * consistent across the entire application at startup.
 */

/**
 * Initialize user role from token on app startup
 * This should be called early in the application lifecycle
 */
export const initializeUserRole = () => {
  console.log('[RoleInitializer] Initializing user role');
  
  try {
    // Skip if role is already forced (for testing)
    const forcedRole = localStorage.getItem('forcedRole');
    if (forcedRole) {
      console.log('[RoleInitializer] Using forced role:', forcedRole);
      return;
    }
    
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[RoleInitializer] No token found, skipping role initialization');
      return;
    }
    
    // Extract role from token
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return;
      
      const payload = JSON.parse(atob(parts[1]));
      console.log('[RoleInitializer] Token payload:', payload);
      
      let role = 'alumno'; // Default role
      
      // Check for roles in resource_access
      if (payload.resource_access && 
          payload.resource_access.ateacher_client_api_rest && 
          payload.resource_access.ateacher_client_api_rest.roles) {
        
        const roles = payload.resource_access.ateacher_client_api_rest.roles;
        console.log('[RoleInitializer] Client roles found:', roles);
        
        // Check for profesor role first (priority)
        if (roles.includes('profesor_client_role')) {
          role = 'profesor';
        }
        // Only set alumno if profesor wasn't found
        else if (roles.includes('alumno_client_role')) {
          role = 'alumno';
        }
      }
      
      // Store the role in localStorage for consistent access
      localStorage.setItem('userRole', role);
      console.log('[RoleInitializer] User role set to:', role);
      
      // Set a special flag to indicate role was properly initialized
      localStorage.setItem('roleInitialized', 'true');
      
    } catch (error) {
      console.error('[RoleInitializer] Error extracting role from token:', error);
    }
  } catch (error) {
    console.error('[RoleInitializer] Error initializing user role:', error);
  }
};

/**
 * Check if role needs to be refreshed and do it if necessary
 * This should be called on app initialization and after login
 */
export const refreshUserRole = async (forceRefresh = false) => {
  if (forceRefresh || !localStorage.getItem('roleInitialized')) {
    console.log('[RoleInitializer] Refreshing user role');
    initializeUserRole();
    return true;
  }
  return false;
};

export default {
  initializeUserRole,
  refreshUserRole
};

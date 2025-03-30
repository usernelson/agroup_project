/**
 * Keycloak Helper Functions
 * 
 * Specialized utilities for working with Keycloak tokens and roles
 */

/**
 * Extract user role from Keycloak token
 * @param {string} token - JWT token from Keycloak
 * @returns {string} - Normalized role (profesor or alumno)
 */
export const extractRoleFromToken = (token) => {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    console.log('[KeycloakHelpers] Examining token payload for roles');
    
    // Define all possible role variations
    const profesorRoles = ['profesor', 'profesor_client_role', 'teacher', 'admin', 'PROFESOR', 'TEACHER', 'ADMIN'];
    const alumnoRoles = ['alumno', 'alumno_client_role', 'student', 'ALUMNO', 'STUDENT'];
    
    // Check Keycloak resource_access which contains client roles
    let allRoles = [];
    
    // Check all possible places where roles could be stored
    if (payload.resource_access) {
      // Look in all client configurations
      Object.values(payload.resource_access).forEach(client => {
        if (client.roles && Array.isArray(client.roles)) {
          allRoles = [...allRoles, ...client.roles];
        }
      });
    }
    
    // Check realm roles
    if (payload.realm_access && payload.realm_access.roles) {
      allRoles = [...allRoles, ...payload.realm_access.roles];
    }
    
    // Check direct role properties
    if (payload.role) {
      allRoles.push(payload.role);
    }
    
    // Check roles array if exists
    if (payload.roles && Array.isArray(payload.roles)) {
      allRoles = [...allRoles, ...payload.roles];
    }
    
    console.log('[KeycloakHelpers] All found roles:', allRoles);
    
    // Normalize all roles to lowercase for comparison
    const normalizedRoles = allRoles.map(role => typeof role === 'string' ? role.toLowerCase() : role);
    
    // Check if user has both profesor and alumno roles simultaneously
    const hasProfesorRole = profesorRoles.some(role => 
      normalizedRoles.includes(role.toLowerCase())
    );
    
    const hasAlumnoRole = alumnoRoles.some(role => 
      normalizedRoles.includes(role.toLowerCase())
    );
    
    // If user has both roles, log a warning and prioritize profesor role
    if (hasProfesorRole && hasAlumnoRole) {
      console.warn('[KeycloakHelpers] ⚠️ User has both profesor and alumno roles! Prioritizing profesor role.');
      return 'profesor';
    }
    
    // Check for profesor role in collected roles
    if (hasProfesorRole) {
      console.log(`[KeycloakHelpers] Found professor role`);
      return 'profesor';
    }
    
    // Check for alumno role in collected roles
    if (hasAlumnoRole) {
      console.log(`[KeycloakHelpers] Found student role`);
      return 'alumno';
    }
    
    // Last resort: Look for clues in email or other fields
    if (payload.email) {
      const email = payload.email.toLowerCase();
      if (email.includes('prof') || email.includes('teach') || email.includes('admin')) {
        console.log('[KeycloakHelpers] Guessing role from email - appears to be profesor');
        return 'profesor';
      }
      if (email.includes('student') || email.includes('alumn')) {
        console.log('[KeycloakHelpers] Guessing role from email - appears to be alumno');
        return 'alumno';
      }
    }
    
    // Default to alumno if no role found
    console.warn('[KeycloakHelpers] No specific role found, defaulting to alumno');
    return 'alumno';
  } catch (error) {
    console.error('[KeycloakHelpers] Error extracting role from token:', error);
    return 'alumno'; // Default role on error
  }
};

/**
 * Check if token contains multiple conflicting roles
 * @param {string} token - JWT token from Keycloak
 * @returns {boolean} - True if token has both profesor and alumno roles
 */
export const hasConflictingRoles = (token) => {
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Define role variations to check
    const profesorRoles = ['profesor', 'profesor_client_role', 'teacher', 'admin'];
    const alumnoRoles = ['alumno', 'alumno_client_role', 'student'];
    
    // Extract all roles from token
    let allRoles = [];
    
    if (payload.resource_access) {
      Object.values(payload.resource_access).forEach(client => {
        if (client.roles && Array.isArray(client.roles)) {
          allRoles = [...allRoles, ...client.roles];
        }
      });
    }
    
    // Normalize roles to lowercase
    const normalizedRoles = allRoles.map(role => 
      typeof role === 'string' ? role.toLowerCase() : role
    );
    
    // Check if both role types exist
    const hasProfesor = profesorRoles.some(role => 
      normalizedRoles.includes(role.toLowerCase())
    );
    
    const hasAlumno = alumnoRoles.some(role => 
      normalizedRoles.includes(role.toLowerCase())
    );
    
    return hasProfesor && hasAlumno;
  } catch (error) {
    console.error('[KeycloakHelpers] Error checking conflicting roles:', error);
    return false;
  }
};

/**
 * Consistently get user role from available sources
 * @returns {string} - User role (profesor or alumno)
 */
export const getUserRole = () => {
  console.log('[KeycloakHelpers] getUserRole called');
  
  // First check for development mode override
  if (process.env.NODE_ENV === 'development') {
    const urlParams = new URLSearchParams(window.location.search);
    const overrideRole = urlParams.get('role');
    if (overrideRole && ['profesor', 'alumno'].includes(overrideRole.toLowerCase())) {
      console.log('[KeycloakHelpers] Using URL override role:', overrideRole);
      return overrideRole.toLowerCase();
    }
  }
  
  // Then check for forced role (testing/debugging)
  try {
    const forcedRole = localStorage.getItem('forcedRole');
    if (forcedRole) {
      console.log('[KeycloakHelpers] Using forced role:', forcedRole);
      return forcedRole.toLowerCase();
    }
  } catch (e) {
    console.warn('[KeycloakHelpers] Error checking for forced role:', e);
  }
  
  // Then check localStorage for stored role
  try {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      console.log('[KeycloakHelpers] Using stored role:', storedRole);
      return storedRole.toLowerCase();
    }
  } catch (e) {
    console.warn('[KeycloakHelpers] Error reading from localStorage:', e);
  }
  
  // Finally, extract role from token
  try {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('[KeycloakHelpers] Extracting role from token');
      
      // Check for conflicting roles and warn if found
      if (hasConflictingRoles(token)) {
        console.warn('[KeycloakHelpers] ⚠️ User has conflicting roles in token! This may cause permission issues.');
      }
      
      const extractedRole = extractRoleFromToken(token);
      if (extractedRole) {
        // Store for future use
        localStorage.setItem('userRole', extractedRole);
        return extractedRole;
      }
    }
  } catch (e) {
    console.warn('[KeycloakHelpers] Error extracting role from token:', e);
  }
  
  // Default role
  console.warn('[KeycloakHelpers] No role found from any source, defaulting to alumno');
  return 'alumno';
};

/**
 * Format display name for user role
 * @param {string} role - Raw role value
 * @returns {string} - Display name for the role
 */
export const formatRoleDisplayName = (role) => {
  if (!role) return 'Estudiante';
  
  const normalizedRole = role.toLowerCase();
  
  if (normalizedRole === 'profesor' || 
      normalizedRole === 'profesor_client_role' || 
      normalizedRole === 'teacher' ||
      normalizedRole === 'admin') {
    return 'Profesor';
  }
  
  return 'Estudiante';
};

/**
 * Check if a user has a specific role
 * @param {string} userRole - The user's role 
 * @param {string} requiredRole - The role to check for
 * @returns {boolean} - True if user has the required role
 */
export const hasRole = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) return false;
  
  const normalizedUserRole = userRole.toLowerCase();
  const normalizedRequiredRole = requiredRole.toLowerCase();
  
  // Handle professor role variants
  if (normalizedRequiredRole === 'profesor' || 
      normalizedRequiredRole === 'teacher' || 
      normalizedRequiredRole === 'admin') {
    return normalizedUserRole === 'profesor' || 
           normalizedUserRole === 'profesor_client_role' || 
           normalizedUserRole === 'teacher' || 
           normalizedUserRole === 'admin';
  }
  
  // Handle student role variants
  if (normalizedRequiredRole === 'alumno' || normalizedRequiredRole === 'student') {
    return normalizedUserRole === 'alumno' || 
           normalizedUserRole === 'alumno_client_role' || 
           normalizedUserRole === 'student';
  }
  
  // Direct comparison for other roles
  return normalizedUserRole === normalizedRequiredRole;
};

/**
 * Debug the current user role determination across all components
 * This helps identify inconsistencies in role handling
 */
export const debugUserRole = () => {
  console.group('🔍 User Role Debug');
  
  try {
    // 1. Check forced role
    const forcedRole = localStorage.getItem('forcedRole');
    console.log('Forced role from localStorage:', forcedRole);
    
    // 2. Check localStorage
    const storedRole = localStorage.getItem('userRole');
    console.log('User role from localStorage:', storedRole);
    
    // 3. Check token directly
    const token = localStorage.getItem('token');
    let tokenRole = null;
    
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          
          // Get roles from resource_access
          let roles = [];
          if (payload.resource_access && 
              payload.resource_access.ateacher_client_api_rest && 
              payload.resource_access.ateacher_client_api_rest.roles) {
            roles = payload.resource_access.ateacher_client_api_rest.roles;
          }
          
          console.log('Roles from token:', roles);
          
          if (roles.includes('profesor_client_role')) {
            tokenRole = 'profesor';
          } else if (roles.includes('alumno_client_role')) {
            tokenRole = 'alumno';
          }
          
          console.log('Role determined from token:', tokenRole);
        }
      } catch (e) {
        console.warn('Error parsing token:', e);
      }
    } else {
      console.log('No token available');
    }
    
    // Call getUserRole to show what the application would use
    const effectiveRole = getUserRole ? getUserRole() : 'unknown';
    console.log('Effective role from getUserRole():', effectiveRole);
    
    // Check for inconsistencies
    if (storedRole && storedRole !== effectiveRole) {
      console.warn('⚠️ Inconsistency: localStorage role differs from effective role');
    }
    
    if (tokenRole && tokenRole !== effectiveRole) {
      console.warn('⚠️ Inconsistency: token role differs from effective role');
    }
    
  } catch (e) {
    console.error('Error in role debugging:', e);
  }
  
  console.groupEnd();
};

// Add this function to the exports
export default {
  extractRoleFromToken,
  getUserRole,
  formatRoleDisplayName,
  hasRole,
  hasConflictingRoles,
  debugUserRole
};

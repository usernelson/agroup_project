/**
 * Utilidades de depuración para la aplicación
 */

// Imprimir información sobre el sidebar y los enlaces de navegación
export const debugSidebar = (userRole, filteredLinks, originalLinks) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group('🔍 Dashboard Sidebar Debug');
  console.log('User Role:', userRole);
  console.log('Original Nav Links:', originalLinks.length);
  console.log('Filtered Nav Links:', filteredLinks.length);
  
  if (filteredLinks.length === 0) {
    console.warn('⚠️ No links available after filtering!');
    console.log('Original links:', originalLinks.map(l => ({
      label: l.label,
      path: l.path,
      forRoles: l.forRoles
    })));
  } else {
    console.log('Available links:', filteredLinks.map(l => l.label).join(', '));
  }
  
  console.groupEnd();
};

// Imprimir información sobre el estado de autenticación
export const debugAuth = (auth) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group('🔑 Auth Debug');
  console.log('Is Authenticated:', auth.isAuthenticated);
  console.log('User Role:', auth.userRole);
  console.log('Has Profile:', !!auth.userProfile);
  console.log('Is Loading:', auth.isLoading);
  console.groupEnd();
};

/**
 * Debug role detection across all possible sources
 * This helps identify where role detection issues might be happening
 */
export const debugRoleDetection = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group('👤 Role Detection Debug');
  
  // Check localStorage
  try {
    const storedRole = localStorage.getItem('userRole');
    console.log('Role in localStorage:', storedRole);
  } catch (e) {
    console.warn('Error reading role from localStorage:', e);
  }
  
  // Check forced role
  try {
    const forcedRole = localStorage.getItem('forcedRole');
    console.log('Forced role in localStorage:', forcedRole);
  } catch (e) {
    console.warn('Error reading forced role from localStorage:', e);
  }
  
  // Check token
  try {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('Token payload:', {
            email: payload.email,
            sub: payload.sub,
            resource_access: payload.resource_access,
            realm_access: payload.realm_access,
            roles: payload.roles
          });
        }
      } catch (e) {
        console.warn('Error parsing token:', e);
      }
    } else {
      console.log('No token in localStorage');
    }
  } catch (e) {
    console.warn('Error reading token from localStorage:', e);
  }
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlRole = urlParams.get('role');
  console.log('Role in URL:', urlRole);
  
  console.groupEnd();
};

export default {
  debugSidebar,
  debugAuth,
  debugRoleDetection
};

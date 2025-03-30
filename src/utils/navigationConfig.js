/**
 * Configuración centralizada de navegación
 * Este archivo contiene todas las opciones de navegación de la aplicación,
 * permitiendo mantener consistencia entre versión móvil y escritorio.
 */

// Función para obtener elementos de navegación según el rol
export const getNavigationItems = (userRole) => {
  // CRITICAL FIX: Always check localStorage directly to avoid race conditions
  let normalizedRole;
  
  try {
    // First check localStorage directly as the source of truth
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      normalizedRole = storedRole.toLowerCase();
      console.log('[NavigationConfig] Using role from localStorage:', normalizedRole);
    } else {
      // Fallback to passed role if localStorage is empty
      normalizedRole = userRole ? userRole.toLowerCase() : null;
      console.log('[NavigationConfig] Using passed role:', normalizedRole);
    }
  } catch (e) {
    // If localStorage access fails, use passed role
    normalizedRole = userRole ? userRole.toLowerCase() : null;
    console.warn('[NavigationConfig] Error accessing localStorage, using passed role:', normalizedRole);
  }
  
  // Check for Keycloak profesor roles (multiple possible formats)
  const isTeacher = normalizedRole === 'profesor' || 
                    normalizedRole === 'profesor_client_role' || 
                    normalizedRole === 'teacher';
  
  console.log('[NavigationConfig] Final determined role:', normalizedRole, 'isTeacher:', isTeacher);
  
  // Base navigation items for all users (students and professors)
  const baseItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      mobileLabel: 'Inicio',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      roles: ['all']
    },
    {
      path: '/dashboard/profile',
      label: 'Mi Perfil',
      mobileLabel: 'Perfil',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      roles: ['all']
    }
  ];
  
  // Only add teacher-specific items if user is a teacher (profesor)
  if (isTeacher) {
    console.log('[NavigationConfig] Adding profesor-specific management items');
    return [
      ...baseItems,
      {
        path: '/dashboard/users',
        label: 'Gestión de Alumnos',
        mobileLabel: 'Alumnos',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        ),
        roles: ['profesor', 'profesor_client_role', 'teacher']
      }
    ];
  }
  
  // Just return base items for non-professors (students)
  return baseItems;
};

// Function exists only for compatibility with older code
export const filterNavigationItems = (items, userRole) => {
  console.log('[DEPRECATED] filterNavigationItems should not be used anymore');
  return items;
};

// Create proper export object
const navigationConfig = {
  getNavigationItems,
  filterNavigationItems
};

export default navigationConfig;

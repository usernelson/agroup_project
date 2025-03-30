/**
 * Central route configuration
 * 
 * Define all routes in one place to avoid hardcoding paths
 * and ensure consistency across the application
 */

// Route names (for navigation)
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  DASHBOARD_CHAT: '/dashboard/chat',
  DASHBOARD_USERS: '/dashboard/users',
  DASHBOARD_ATEACHER: '/dashboard/ateacher',
  DASHBOARD_ROOMS: '/dashboard/rooms',
  DASHBOARD_PROFILE: '/dashboard/profile',
  DASHBOARD_IA_CHAT: '/dashboard/ia-chat',
  PROFILE: '/profile',
  CALENDAR: '/calendar',
  ROOMS: '/rooms',
  CHAT: '/chat',
  RESOURCES: '/resources',
  ADMIN: '/admin'
};

// Route titles (for display in UI)
export const ROUTE_TITLES = {
  [ROUTES.HOME]: 'Home',
  [ROUTES.LOGIN]: 'Iniciar Sesión',
  [ROUTES.REGISTER]: 'Registrarse',
  [ROUTES.DASHBOARD]: 'Panel Principal',
  [ROUTES.DASHBOARD_CHAT]: 'Chat IA',
  [ROUTES.DASHBOARD_USERS]: 'Gestión de Alumnos',
  [ROUTES.PROFILE]: 'Mi Perfil',
  [ROUTES.DASHBOARD_PROFILE]: 'Mi Perfil',
  [ROUTES.CALENDAR]: 'Calendario',
  [ROUTES.ROOMS]: 'Salas Virtuales',
  [ROUTES.DASHBOARD_ROOMS]: 'Salas Virtuales',
  [ROUTES.CHAT]: 'Chat IA',
  [ROUTES.DASHBOARD_IA_CHAT]: 'Chat IA',
  [ROUTES.DASHBOARD_ATEACHER]: 'aTeacher',
  [ROUTES.RESOURCES]: 'Recursos',
  [ROUTES.ADMIN]: 'Administración'
};

// Route icons - for consistent icon usage across the app
export const ROUTE_ICONS = {
  [ROUTES.HOME]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  [ROUTES.DASHBOARD]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  [ROUTES.PROFILE]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  [ROUTES.CHAT]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  [ROUTES.CALENDAR]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  // Add more route icons as needed
};

// Role-based route access configuration
export const ROLE_ACCESS = {
  // Routes available to all authenticated users
  ALL: [
    ROUTES.DASHBOARD,
    ROUTES.PROFILE,
    ROUTES.DASHBOARD_PROFILE,
    ROUTES.CALENDAR,
    ROUTES.CHAT,
    ROUTES.DASHBOARD_CHAT,
    ROUTES.RESOURCES,
    ROUTES.DASHBOARD_IA_CHAT
  ],
  PROFESOR: [
    ROUTES.DASHBOARD_USERS,
    ROUTES.DASHBOARD_ATEACHER,
    ROUTES.ROOMS,
    ROUTES.DASHBOARD_ROOMS,
    ROUTES.ADMIN
  ],
  ALUMNO: [
    ROUTES.DASHBOARD_IA_CHAT
  ]
};

// Helper to check if user has access to a route
export const hasRouteAccess = (route, userRole) => {
  if (!userRole) return false;
  if (ROLE_ACCESS.ALL.includes(route)) return true;
  
  const normalizedRole = userRole.toLowerCase();
  
  if (normalizedRole === 'profesor' && ROLE_ACCESS.PROFESOR.includes(route)) return true;
  if (normalizedRole === 'alumno' && ROLE_ACCESS.ALUMNO.includes(route)) return true;
  
  return false;
};

// Default route by user role (where to redirect after login)
export const getDefaultRouteByRole = (role) => {
  switch (role?.toLowerCase()) {
    case 'profesor':
    case 'alumno':
      return ROUTES.DASHBOARD;
    default:
      return ROUTES.HOME;
  }
};

// Get parent route path
export const getParentRoute = (route) => {
  const pathParts = route.split('/');
  if (pathParts.length <= 2) return ROUTES.HOME;
  
  return `/${pathParts[1]}`;
};

// Check if a route is active (including child routes)
export const isRouteActive = (currentPath, routePath) => {
  // Exact match
  if (currentPath === routePath) return true;
  
  // Check if it's a parent of the current path (for nested routes)
  if (routePath !== '/' && currentPath.startsWith(routePath + '/')) return true;
  
  return false;
};

// Get breadcrumbs for a route
export const getBreadcrumbs = (route) => {
  const breadcrumbs = [];
  const parts = route.split('/').filter(part => part);
  
  // Always start with home
  breadcrumbs.push({
    path: ROUTES.HOME,
    label: 'Home'
  });
  
  // Add each level
  let currentPath = '';
  parts.forEach(part => {
    currentPath += `/${part}`;
    
    // Find the title for this route
    const title = ROUTE_TITLES[currentPath] || part.charAt(0).toUpperCase() + part.slice(1);
    
    breadcrumbs.push({
      path: currentPath,
      label: title
    });
  });
  
  return breadcrumbs;
};

// Map page components to routes for easier imports
export const ROUTE_COMPONENTS = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.DASHBOARD_CHAT]: 'DashboardChat',
  [ROUTES.DASHBOARD_USERS]: 'DashboardUsers',
  [ROUTES.DASHBOARD_PROFILE]: 'Profile',
  [ROUTES.DASHBOARD_ATEACHER]: 'ATeacher',
  [ROUTES.DASHBOARD_ROOMS]: 'RoomManagement',
  [ROUTES.DASHBOARD_IA_CHAT]: 'IAChat',
  [ROUTES.LOGIN]: 'Login',
  [ROUTES.REGISTER]: 'Register',
  [ROUTES.PROFILE]: 'Profile',
  [ROUTES.CALENDAR]: 'Calendar',
  [ROUTES.ROOMS]: 'Rooms',
  [ROUTES.CHAT]: 'Chat',
  [ROUTES.RESOURCES]: 'Resources',
  [ROUTES.ADMIN]: 'Admin'
};

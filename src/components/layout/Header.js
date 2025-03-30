import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { useAuthSafe } from '../../utils/contextHelpers';
import { formatRoleDisplayName, getUserRole } from '../../utils/keycloakHelpers';

// Header container with shadow and z-index
const HeaderContainer = styled.header`
  background-color: var(--card-background);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1001; /* Higher than sidebar */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  transition: all 0.3s ease;
  padding-left: calc(1.5rem + 40px); /* Space for menu toggle */
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    height: 60px;
  }
`;

// Left side of header with logo and toggle
const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

// CRITICAL FIX: Add missing MenuToggle styled component
const MenuToggle = styled.button`
  background: transparent;
  border: none;
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  margin-right: 1rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--background-alt-color);
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

// CRITICAL FIX: Add missing Logo styled component
const Logo = styled(Link)`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  text-decoration: none;
  display: flex;
  align-items: center;
  
  span {
    margin-left: 0.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const PageTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%; // Limitamos el ancho para evitar desbordamiento
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
    max-width: 50%; // Más restrictivo en tablets
  }
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
    max-width: 40%; // Aún más restrictivo en móviles pequeños
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

// Improved UserProfile section with responsive text
const UserProfile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 10px;
  transition: all 0.3s ease;
  
  @media (max-width: 600px) {
    margin-right: 6px; // Menos margen en dispositivos medianos
  }
  
  @media (max-width: 480px) {
    display: none; // Mantener oculto en pantallas muy pequeñas
  }
`;

// Nuevos componentes para mostrar notificaciones educativas
const EducationalBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: ${props => props.color || 'var(--primary-color)'};
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  border: 2px solid var(--card-background);
`;

const UserName = styled.span`
  font-weight: 600; /* Make name bolder */
  font-size: 1rem; /* Slightly larger font */
  color: var(--text-color);
`;

const UserRole = styled.span`
  font-size: 0.85rem; /* Slightly larger font */
  color: var(--primary-color); /* Use primary color for role */
  font-weight: 500;
`;

// Enhanced ProfileAvatar with better hover effect and mobile optimization
const ProfileAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  box-shadow: var(--shadow-md);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer; // Asegurar que se vea claramente como un elemento clickeable
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--button-shadow);
    border-color: var(--accent-color);
  }
  
  @media (max-width: 480px) {
    width: 38px; // Ligeramente más pequeño
    height: 38px;
    font-size: 0.95rem;
    border-width: 1.5px; // Borde más delgado
  }
  
  @media (max-width: 360px) {
    width: 34px; // Aún más pequeño para dispositivos realmente pequeños
    height: 34px;
    font-size: 0.9rem;
  }
`;

const ProfileButton = styled.div`
  position: relative;
  cursor: pointer;
`;

// Mejora el diseño del menú de perfil para que todos los elementos sean consistentes
const ProfileMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-color);
  min-width: 250px;
  z-index: var(--z-dropdown);
  overflow: hidden;
  transform-origin: top right;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  opacity: ${props => props.$isOpen ? '1' : '0'};
  transform: ${props => props.$isOpen ? 'scale(1)' : 'scale(0.9)'};
  pointer-events: ${props => props.$isOpen ? 'all' : 'none'};
  
  @media (max-width: 480px) {
    top: calc(100% + 4px);
    min-width: 220px;
    right: -5px;
    max-width: 90vw;
  }
`;

// Enhance profile header with gradient background
const ProfileHeader = styled.div`
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-color);
  background: var(--gradient);
  color: white;
  text-align: center;
  
  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  p {
    margin: 0;
    margin-top: 4px;
    font-size: 0.85rem;
    opacity: 0.9;
  }
`;

// Base styles for all menu items (both links and buttons)
const menuItemBaseStyles = `
  display: flex;
  align-items: center;
  padding: 0.9rem 1.2rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  svg {
    width: 20px;
    height: 20px;
    margin-right: 0.8rem;
    stroke-width: 2.2;
  }
  
  &:hover, &:active {
    background-color: var(--background-alt-color);
    transform: translateX(5px);
  }
  
  @media (max-width: 480px) {
    min-height: var(--mobile-touch-target);
    padding: 0.8rem 1.1rem;
  }
`;

// Consistent menu item styling for all options
const MenuItem = styled(Link)`
  ${menuItemBaseStyles}
  color: var(--text-color);
  text-decoration: none;
  
  svg {
    color: var(--primary-color);
  }
  
  &:hover, &:active {
    color: var(--primary-color);
  }
`;

// Menu button that matches MenuItem styling but for logout
const MenuItemButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0.9rem 1.2rem;
  color: var(--text-color);
  transition: all 0.2s ease;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  font-weight: 500;
  
  svg {
    width: 20px;
    height: 20px;
    margin-right: 0.8rem;
    color: var(--error-color);
    stroke-width: 2.2;
    flex-shrink: 0;
  }
  
  &:hover, &:active {
    background-color: var(--background-alt-color);
    transform: translateX(5px);
    color: var(--error-color);
  }
  
  @media (max-width: 480px) {
    min-height: var(--mobile-touch-target);
    padding: 0.8rem 1.1rem;
  }
`;

// Menu divider component - was referenced but not defined
const MenuDivider = styled.div`
  height: 1px;
  background-color: var(--border-color);
  margin: 0.5rem 0;
  opacity: 0.6;
`;

const ThemeToggleButton = styled.button`
  background: var(--background-alt-color);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 1rem;
  transition: all 0.3s ease;
  font-size: 1.2rem;
  
  &:hover {
    transform: rotate(15deg);
    background: var(--background-color);
  }
  
  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
    margin-right: 0.5rem;
  }
`;

// Mapa de títulos para rutas específicas
const routeTitles = {
  "/dashboard": "Panel Principal",
  "/dashboard/profile": "Mi Perfil",
  "/dashboard/users": "Gestión de Alumnos",
  "/dashboard/resources": "Recursos Educativos",
};

/**
 * Main Header Component for the application
 * Displays the logo, sidebar toggle, and user information
 */
const Header = ({ toggleSidebar, sidebarOpen, userRole = 'alumno', isTeacher = false }) => {
  // CRITICAL FIX: Use the safe auth helper to get user role
  const auth = useAuthSafe();
  const { userProfile, userRole: contextUserRole } = auth;
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Get effective role with robust fallback strategy
  const effectiveRole = React.useMemo(() => {
    // First check direct context
    if (contextUserRole) {
      return contextUserRole.toLowerCase();
    }
    
    // Then consult the specialized helper
    return getUserRole();
  }, [contextUserRole]);
  
  // Debug role state
  console.log('[Header] Role state:', {
    contextRole: contextUserRole,
    effectiveRole,
    isProfesor: effectiveRole === 'profesor'
  });
  
  // Format display name from profile or fallback
  const userName = userProfile?.firstName || userProfile?.given_name || 'Usuario';
  
  // Format role display name using helper
  const formattedRole = formatRoleDisplayName(effectiveRole);
  
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [educationalAlerts, setEducationalAlerts] = useState(0); // Define educationalAlerts
  const profileMenuRef = useRef(null);

  // Cargar alertas educativas - mantener como estaba
  useEffect(() => {
    // En un escenario real, estas alertas vendrían de una API
    const fetchEducationalNotifications = async () => {
      // Simular carga de datos
      setPendingTasks(Math.floor(Math.random() * 3));
    };
    
    fetchEducationalNotifications();
  }, [contextUserRole]);
  
  // Función mejorada para manejar el cierre de sesión
  const handleLogout = async () => {
    try {
      console.log('[Header] Attempting to log out');
      
      // Close the menu
      setProfileMenuOpen(false);
      
      if (auth && typeof auth.logout === 'function') {
        await auth.logout();
        console.log('[Header] Logout successful via auth context');
      } else {
        // Fallback manual logout
        console.log('[Header] Using fallback logout method');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userProfile');
        
        // Navigate to login page
        navigate('/login?logout=true');
      }
    } catch (error) {
      console.error('[Header] Error during logout:', error);
      
      // Force logout on error
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');
      
      // Redirect to login
      window.location.href = '/login?logout=true';
    }
  };
  
  // Determinar el título de la página actual
  const getPageTitle = () => {
    const path = location.pathname;
    
    // Check for exact match first
    if (routeTitles[path]) {
      return routeTitles[path];
    }
    
    // Check for nested routes
    for (const route in routeTitles) {
      if (path.startsWith(route) && route !== '/dashboard') {
        return routeTitles[route];
      }
    }
    
    return "Dashboard";
  };
  
  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Get user's initials for avatar - mejorado para manejar nombres incompletos
  const getInitials = () => {
    if (!userName) return '?';
    
    // If user name includes a space, take first letter of first and last name
    if (userName.includes(' ')) {
      const names = userName.split(' ');
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    
    // Otherwise return first letter of name
    return userName.charAt(0).toUpperCase();
  };
  
  return (
    <HeaderContainer>
      <HeaderLeft>
        <MenuToggle 
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </MenuToggle>
        
        <Logo to="/dashboard">
          AGroup APP
        </Logo>
      </HeaderLeft>
      
      <PageTitle>{getPageTitle()}</PageTitle>
      
      <UserInfo>
        <ThemeToggleButton 
          onClick={toggleTheme}
          title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          aria-label="Cambiar tema"
        >
          {isDarkMode ? "☀️" : "🌙"}
        </ThemeToggleButton>
        
        <UserProfile>
          <UserName>{userName}</UserName>
          <UserRole>{formattedRole}</UserRole>
        </UserProfile>
        
        <ProfileButton ref={profileMenuRef}>
          <ProfileAvatar onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
            {getInitials()}
            {educationalAlerts > 0 || pendingTasks > 0 ? (
              <EducationalBadge color={educationalAlerts > 0 ? 'var(--error-color)' : 'var(--warning-color)'}>
                {educationalAlerts || pendingTasks}
              </EducationalBadge>
            ) : null}
          </ProfileAvatar>
          
          <ProfileMenu $isOpen={profileMenuOpen}>
            <ProfileHeader>
              <h3>{userName}</h3>
              <p>{formattedRole}</p>
            </ProfileHeader>
            
            <MenuItem to="/dashboard/profile" onClick={() => setProfileMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Mi Perfil
            </MenuItem>
            
            {/* CRITICAL FIX: Use lowercase comparison and make case-insensitive */}
            {(effectiveRole === 'profesor') && (
              <MenuItem to="/dashboard/users" onClick={() => setProfileMenuOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Gestionar Alumnos
              </MenuItem>
            )}
            
            <MenuDivider />
            
            <MenuItemButton 
              onClick={handleLogout}
              role="menuitem"
              aria-label="Cerrar sesión"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Cerrar Sesión
            </MenuItemButton>
          </ProfileMenu>
        </ProfileButton>
      </UserInfo>
    </HeaderContainer>
  );
};

export default Header;
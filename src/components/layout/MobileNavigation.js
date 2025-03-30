import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthSafe } from '../../utils/contextHelpers';
import { getNavigationItems } from '../../utils/navigationConfig';

// Mejoradas: Constantes para Z-index y altura
const MOBILE_NAV_HEIGHT = '65px';
const Z_INDEX_MOBILE_NAV = 1010; // Mayor que header y sidebar

// Componente mejorado para navegación móvil con mejor posicionamiento
const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${MOBILE_NAV_HEIGHT};
  background-color: var(--card-background);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.15);
  z-index: ${Z_INDEX_MOBILE_NAV};
  display: none;
  border-top: 1px solid var(--border-color);
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const NavList = styled.ul`
  display: flex;
  justify-content: space-around;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  height: 100%;
`;

const NavItem = styled.li`
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

// Enlaces de navegación mejorados con animación en hover y estado activo
const NavLink = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: ${props => props.$isActive ? 'var(--primary-color)' : 'var(--text-color)'};
  font-size: 0.7rem;
  width: 100%;
  height: 100%;
  padding: 0.25rem 0;
  position: relative;
  
  // Indicador de elemento activo
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: ${props => props.$isActive ? '40%' : '0'};
    height: 3px;
    background: var(--primary-color);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  
  svg {
    width: 24px;
    height: 24px;
    margin-bottom: 0.25rem;
    opacity: ${props => props.$isActive ? '1' : '0.7'};
    transition: all 0.2s ease;
  }
  
  &:hover {
    color: var(--primary-color);
    
    svg {
      opacity: 1;
      transform: translateY(-2px);
    }
    
    &::after {
      width: 20%;
    }
  }
`;

const MobileNavigation = () => {
  const location = useLocation();
  const { userRole } = useAuthSafe();
  
  // CRITICAL FIX: Always check localStorage to get the most current role value
  const storedRole = React.useMemo(() => {
    try {
      return localStorage.getItem('userRole');
    } catch (e) {
      console.warn('[MobileNavigation] Error reading from localStorage:', e);
      return null;
    }
  }, []);
  
  // Use stored role with fallback to context role
  const effectiveRole = storedRole || userRole || 'alumno';
  
  console.log('[MobileNavigation] userRole from context:', userRole);
  console.log('[MobileNavigation] userRole from localStorage:', storedRole);
  console.log('[MobileNavigation] Using effective role:', effectiveRole);
  
  // CRITICAL FIX: Use the effective role for navigation items
  const navItems = getNavigationItems(effectiveRole);
  
  console.log('[MobileNavigation] Navigation items count:', navItems.length);
  navItems.forEach((item, index) => {
    console.log(`[MobileNavigation] Item ${index}: ${item.mobileLabel || item.label} (${item.path})`);
  });
  
  // Helper to check if route is active
  const isRouteActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/dashboard';
  };
  
  return (
    <NavContainer>
      <NavList>
        {navItems.map((item, index) => (
          <NavItem key={index}>
            <NavLink 
              to={item.path} 
              $isActive={isRouteActive(item.path)}
            >
              {item.icon}
              <span>{item.mobileLabel || item.label}</span>
            </NavLink>
          </NavItem>
        ))}
      </NavList>
    </NavContainer>
  );
};

export default MobileNavigation;

import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { useAuthSafe } from '../../utils/contextHelpers';
import { getNavigationItems } from '../../utils/navigationConfig';
import { getUserRole, formatRoleDisplayName } from '../../utils/keycloakHelpers';
import { debugRoleDetection } from '../../utils/debugUtils';

// CRITICAL FIX: Make sure the sidebar is visible and has proper z-index
const SidebarContainer = styled.div`
  width: 250px;
  min-height: 100vh;
  background-color: var(--card-background);
  border-right: 1px solid var(--border-color);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000; /* Higher z-index */
  transition: transform 0.3s ease;
  transform: translateX(${props => props.$isOpen ? '0' : '-100%'});
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-top: 70px; /* Add space for header */
  
  @media (max-width: 768px) {
    transform: translateX(${props => props.$isOpen ? '0' : '-100%'});
    width: 80%;
    max-width: 300px;
    z-index: 1001; /* Higher than header */
  }
`;

const SidebarHeader = styled.div`
  padding: 1.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Logo = styled.h1`
  font-size: 1.8rem;
  margin: 0;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
`;

const NavList = styled.ul`
  margin: 0;
  padding: 1rem 0;
  list-style: none;
`;

const NavItem = styled.li`
  margin-bottom: 0.25rem;
`;

// FIX: Improve nav link styling for better aesthetics
// FIX: Reduce icon size in the nav links
const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  color: ${props => props.$isActive ? 'var(--primary-color)' : 'var(--text-color)'};
  text-decoration: none;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 0.25rem 0.75rem;
  font-weight: ${props => props.$isActive ? '600' : '400'};
  background-color: ${props => props.$isActive ? 'rgba(145, 70, 255, 0.1)' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.$isActive ? 'rgba(145, 70, 255, 0.15)' : 'var(--background-alt-color)'};
    transform: translateX(3px);
  }
  
  svg {
    width: 20px; /* FIXED: Reduced from larger size */
    height: 20px; /* FIXED: Reduced from larger size */
    margin-right: 0.75rem;
    opacity: ${props => props.$isActive ? '1' : '0.7'};
  }
`;

const UserInfo = styled.div`
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  margin-top: auto;
  border-top: 1px solid var(--border-color);
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  margin-right: 0.75rem;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  
  .name {
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .role {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-alt-color);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  cursor: pointer;
  
  &:hover {
    background-color: var(--primary-color);
    color: white;
  }
  
  @media (min-width: 769px) {
    display: none;
  }
`;

// CRITICAL FIX: Make sure the forwardRef is implemented correctly
const Sidebar = forwardRef(({ isOpen, toggleSidebar, navigationItems, userRole, isTeacher }, ref) => {
  const location = useLocation();
  const { userProfile } = useAuthSafe();
  
  // IMPROVED: Use the specialized keycloakHelpers for role detection
  const effectiveRole = getUserRole();
  
  // DEBUG: In development, run role detection debugger
  if (process.env.NODE_ENV === 'development') {
    debugRoleDetection();
  }
  
  console.log('[Sidebar] Effective role:', effectiveRole);
  
  // Get navigation items using the effective role
  const navItems = getNavigationItems(effectiveRole);
  
  console.log('[Sidebar] Navigation items count:', navItems.length);
  
  // Get initials for avatar
  const getInitials = () => {
    if (!userProfile) return 'U';
    const firstName = userProfile.firstName || userProfile.given_name || '';
    const lastName = userProfile.lastName || userProfile.family_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Helper to check if route is active
  const isRouteActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/dashboard';
  };
  
  // Format role display using keycloakHelpers for consistency
  const formattedRole = formatRoleDisplayName(effectiveRole);

  return (
    <SidebarContainer 
      $isOpen={isOpen}
      ref={ref} // Apply the forwarded ref here
    >
      {/* Close button */}
      <CloseButton onClick={toggleSidebar}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </CloseButton>
      
      <SidebarHeader>
        <Logo>aTeacher</Logo>
      </SidebarHeader>
      
      <NavList>
        {navItems.map((link, index) => (
          <NavItem key={index}>
            <NavLink 
              to={link.path} 
              $isActive={isRouteActive(link.path)}
              onClick={() => window.innerWidth < 768 && toggleSidebar()}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          </NavItem>
        ))}
      </NavList>
      
      <UserInfo>
        <UserAvatar>{getInitials()}</UserAvatar>
        <UserDetails>
          <span className="name">
            {userProfile?.firstName || userProfile?.given_name || 'Usuario'} {userProfile?.lastName || userProfile?.family_name || ''}
          </span>
          <span className="role">
            {formattedRole}
          </span>
        </UserDetails>
      </UserInfo>
    </SidebarContainer>
  );
});

// Add display name for debugging
Sidebar.displayName = 'Sidebar';

export default Sidebar;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { useAuthSafe } from '../../utils/contextHelpers';
import MobileNavigation from '../../components/layout/MobileNavigation';
import SessionTimeoutModal from '../../components/common/SessionTimeoutModal';
import { getNavigationItems } from '../../utils/navigationConfig';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { debugUserRole } from '../../utils/keycloakHelpers';

// Styled components
const MainContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: var(--background-color);
`;

// FIX: Improve content layout to prevent sidebar overlap
const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; // Ensure content wrapper can shrink below its content size
  margin-left: 250px; /* Match sidebar width */
  transition: margin 0.3s ease;
  
  @media (max-width: 768px) {
    margin-left: 0; /* No margin on mobile as sidebar is hidden by default */
  }
`;

const ContentContainer = styled.main`
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
  padding-top: 90px; /* Account for fixed header */
  
  @media (max-width: 768px) {
    padding: 1rem;
    padding-bottom: 5rem; // Extra padding for mobile navigation
    padding-top: 80px; /* Smaller padding for mobile */
  }
`;

// Complete Dashboard component with proper error handling
const Dashboard = () => {
  const auth = useAuthSafe(); // Move useAuthSafe outside conditional logic
  // CRITICAL FIX: Get auth safely and add robust fallbacks
  try {
    console.log('[Dashboard] Auth object:', auth || 'undefined');
  } catch (error) {
    console.error('[Dashboard] Error using AuthSafe:', error);
  }
  
  // CRITICAL FIX: Add fallbacks for when auth is undefined
  const contextRole = auth?.userRole || null;
  const loading = auth?.loading || false;
  
  // Get role from localStorage as fallback
  const roleFromLocalStorage = useMemo(() => {
    try {
      return localStorage.getItem('userRole') || 'alumno';
    } catch (e) {
      console.warn('[Dashboard] Error reading from localStorage:', e);
      return 'alumno';
    }
  }, []);
  
  // Use effective role with preference for localStorage (more stable)
  const effectiveRole = roleFromLocalStorage || contextRole || 'alumno';
  
  // IMPORTANT: Log role state for debugging
  console.log('[Dashboard] Role state:', {
    contextRole,
    effectiveRole, 
    fromLocalStorage: roleFromLocalStorage
  });
  
  // CRITICAL FIX: Set proper initial state for sidebar
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768); // Default to open on desktop
  const [sessionWarningVisible, setSessionWarningVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [isTeacher, setIsTeacher] = useState(false);

  const timeoutModalRef = useRef(null);
  const sidebarRef = useRef(null);

  // Check viewport size for mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const devicePixelRatio = window.devicePixelRatio;
      
      console.log('[Dashboard] Viewport dimensions:', { width, height, devicePixelRatio });
      const isMobileView = width < 768;
      setIsMobile(isMobileView);
      
      // Only change sidebar state when transitioning between mobile and desktop
      if (isMobileView !== (width < 768)) {
        setSidebarOpen(!isMobileView);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Toggle sidebar with improved logging
  const toggleSidebar = () => {
    console.log('[Dashboard] Toggling sidebar from', sidebarOpen, 'to', !sidebarOpen);
    setSidebarOpen(prevState => !prevState);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && 
          !sidebarRef.current.contains(event.target) && 
          isMobile && 
          sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, sidebarOpen]);

  // CRITICAL FIX: Update role handling to prevent redirect loops
  useEffect(() => {
    // Only proceed if we detect a significant role change that impacts permissions
    if (contextRole && roleFromLocalStorage && 
        contextRole !== roleFromLocalStorage && 
        ((contextRole === 'alumno' && roleFromLocalStorage === 'profesor') || 
         (contextRole === 'profesor' && roleFromLocalStorage === 'alumno'))) {
      
      console.log('[Dashboard] Significant role change from context:', contextRole);
      
      // CRITICAL FIX: Don't trigger a role update if we've already updated recently
      // This prevents redirect loops
      const lastRoleUpdate = sessionStorage.getItem('lastRoleUpdate');
      const now = Date.now();
      if (lastRoleUpdate && (now - parseInt(lastRoleUpdate, 10)) < 10000) {
        console.log('[Dashboard] Skipping role update - too recent');
        return;
      }
      
      console.log('[Dashboard] Privilege level change detected, updating role');
      
      // Record this update to prevent loops
      sessionStorage.setItem('lastRoleUpdate', now.toString());
      
      // FIXED: Instead of trying to modify auth context directly, just update localStorage
      // and only reload if absolutely necessary (role downgrade)
      if (contextRole === 'profesor' && roleFromLocalStorage === 'alumno') {
        // Only for privilege upgrade, update localStorage without reload
        localStorage.setItem('userRole', contextRole);
        console.log('[Dashboard] Updated localStorage role without reload');
      }
    }
  }, [contextRole, roleFromLocalStorage]);

  // Initialize navigation items based on role
  useEffect(() => {
    try {
      console.log('[Dashboard] Initializing navigation items for role:', effectiveRole);
      
      // Normalize role for consistent comparison
      const normalizedRole = effectiveRole ? effectiveRole.toLowerCase() : 'alumno';
      
      // Detect if user is a teacher
      const userIsTeacher = normalizedRole === 'profesor' || normalizedRole === 'teacher';
      setIsTeacher(userIsTeacher);
      
      const items = getNavigationItems(normalizedRole);
      
      console.log('[Dashboard] Navigation items for role:', normalizedRole, items.length);
      setNavItems(items);
    } catch (error) {
      console.error('[Dashboard] Error setting navigation items:', error);
      setNavItems([]);
    }
  }, [effectiveRole]);

  // Check if session warning should be shown
  useEffect(() => {
    if (auth?.sessionWarningShown) {
      setSessionWarningVisible(true);
    }
  }, [auth?.sessionWarningShown]);

  // Log out user if session expires
  const handleSessionExpire = () => {
    try {
      if (auth && typeof auth.logout === 'function') {
        auth.logout();
      } else {
        // Fallback if auth context logout is not available
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        window.location.href = '/login?logout=true';
      }
    } catch (error) {
      console.error('[Dashboard] Error logging out:', error);
      // Force-clear auth data in case of error
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      window.location.href = '/login?logout=true';
    }
  };

  // Improve the session extension handler in Dashboard.js
  const handleSessionExtend = async () => {
    try {
      console.log('[Dashboard] Attempting to extend session');
      setSessionWarningVisible(false);
      
      if (auth && typeof auth.refreshAuth === 'function') {
        await auth.refreshAuth();
        console.log('[Dashboard] Session extended via refreshAuth');
        
        // CRITICAL FIX: Update session warning state in auth context
        if (auth && typeof auth.setSessionWarningShown === 'function') {
          auth.setSessionWarningShown(false);
        }
        
        // Additional fallback - force refresh token API call if needed
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await fetch('/api/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken })
            });
            
            if (response.ok) {
              console.log('[Dashboard] Direct token refresh successful');
            }
          }
        } catch (directRefreshError) {
          console.warn('[Dashboard] Direct token refresh failed:', directRefreshError);
          // Continue anyway since we've already tried refreshAuth
        }
      } else {
        console.warn('[Dashboard] refreshAuth not available, using alternative approach');
        // The session warning will be hidden, which is better than nothing
      }
    } catch (error) {
      console.error('[Dashboard] Error extending session:', error);
      // Even on error, hide the modal to prevent annoying the user
      setSessionWarningVisible(false);
    }
  };

  // Debug user role info
  const debugRoleInfo = () => {
    try {
      console.group('🔑 Dashboard Role Debug');
      console.log('Context Role:', contextRole);
      console.log('LocalStorage Role:', roleFromLocalStorage);
      console.log('Effective Role:', effectiveRole);
      console.log('Is Teacher?', isTeacher);
      
      if (auth && typeof auth.debugRole === 'function') {
        auth.debugRole();
      } else {
        debugUserRole();
      }
      
      console.groupEnd();
    } catch (error) {
      console.error('[Dashboard] Error debugging role:', error);
    }
  };

  // Debug role when component mounts
  useEffect(() => {
    debugRoleInfo();
  }, [debugRoleInfo]);

  // Return loading spinner if auth is still loading
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <MainContainer>
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        navigationItems={navItems}
        ref={sidebarRef}
        userRole={effectiveRole}
        isTeacher={isTeacher}
      />
      
      <ContentWrapper>
        <Header 
          toggleSidebar={toggleSidebar} 
          sidebarOpen={sidebarOpen}
          userRole={effectiveRole}
          isTeacher={isTeacher}
        />
        
        <ContentContainer>
          <Outlet />
        </ContentContainer>
      </ContentWrapper>
      
      <MobileNavigation />
      
      <SessionTimeoutModal 
        isOpen={sessionWarningVisible} 
        onRequestClose={() => setSessionWarningVisible(false)}
        onExtendSession={handleSessionExtend}
        onLogout={handleSessionExpire}
        ref={timeoutModalRef}
      />
    </MainContainer>
  );
};

export default Dashboard;
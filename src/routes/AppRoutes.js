import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '../components/common/ErrorBoundary';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Lazy loaded components for better performance
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const DashboardHome = lazy(() => import('../pages/dashboard/DashboardHome'));
const DashboardProfile = lazy(() => import('../pages/dashboard/DashboardProfile'));
const UserManagement = lazy(() => import('../pages/dashboard/UserManagement'));
const NotFound = lazy(() => import('../pages/NotFound'));

// CRITICAL FIX: Add route change monitoring to detect and break infinite loops
const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Keep track of route changes to detect loops
  useEffect(() => {
    const pathChanges = JSON.parse(sessionStorage.getItem('recentPathChanges') || '[]');
    const now = Date.now();
    
    // Add current path change
    pathChanges.push({
      path: location.pathname,
      time: now
    });
    
    // Only keep last 10 changes
    while (pathChanges.length > 10) {
      pathChanges.shift();
    }
    
    // Save updated changes
    sessionStorage.setItem('recentPathChanges', JSON.stringify(pathChanges));
    
    // Check for rapid loops (5+ same-path changes in 3 seconds)
    if (pathChanges.length >= 5) {
      const recentSamePath = pathChanges.filter(change => 
        change.path === location.pathname && 
        (now - change.time) < 3000
      );
      
      if (recentSamePath.length >= 5) {
        console.error('[AppRoutes] Detected route loop! Breaking cycle by forcing navigation to safety path');
        sessionStorage.setItem('loopDetected', 'true');
        sessionStorage.setItem('recentPathChanges', '[]');
        
        // Force break the loop by navigating to a neutral route
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
      }
    }
  }, [location.pathname, navigate]);
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner $fullScreen />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected dashboard routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            {/* Dashboard child routes */}
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<DashboardProfile />} />
            
            {/* Role-protected routes */}
            <Route path="users" element={
              <ProtectedRoute allowedRoles={['profesor']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            
            {/* Redirect /dashboard/home to /dashboard */}
            <Route path="home" element={<Navigate to="/dashboard" replace />} />
          </Route>
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;

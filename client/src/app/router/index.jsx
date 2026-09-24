import React, { useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../auth/auth.store';
import { checkAuth, setupAxiosInterceptors } from '../../auth/auth.api';
import Login from '../../auth/pages/Login';
import Register from '../../auth/pages/Register';
import StudioShell from '../../studio/pages/StudioShell';
import Dashboard from '../../studio/pages/Dashboard';
import Join from '../../studio/pages/Join';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background text-primary">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background text-primary">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const Root = () => {
  useEffect(() => {
    setupAxiosInterceptors();
    checkAuth();
  }, []);

  return <Outlet />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        path: '/',
        element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        ),
      },
      {
        path: '/register',
        element: (
          <PublicRoute>
            <Register />
          </PublicRoute>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/join/:roomCode?',
        element: (
          <ProtectedRoute>
            <Join />
          </ProtectedRoute>
        ),
      },
      {
        path: '/studio/:roomCode',
        element: (
          <ProtectedRoute>
            <StudioShell />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

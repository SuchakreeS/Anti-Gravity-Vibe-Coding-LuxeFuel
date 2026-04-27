import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate, Outlet } from 'react-router-dom';

function AdminRoute() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;

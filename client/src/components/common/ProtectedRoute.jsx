import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, roles = [], requireCompany = false, requireCompanyAdmin = false }) => {
  const { user, isAuthenticated, hasRole, isCompanyAdmin, getCompany } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles required, check if user has required role
  if (roles.length > 0 && !hasRole(roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If company association is required
  if (requireCompany && !getCompany()) {
    return <Navigate to="/company/setup" replace />;
  }

  // If company admin privileges required
  if (requireCompanyAdmin && !isCompanyAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
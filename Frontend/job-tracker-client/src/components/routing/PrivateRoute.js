import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const PrivateRoute = ({ roles = [] }) => {
  const { isAuthenticated, hasRole } = React.useContext(AuthContext);
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if route requires specific roles
  if (roles.length > 0 && !roles.some(role => hasRole(role))) {
    // For debugging
    console.log('Role check failed:', roles, 'User has roles:', hasRole('Admin'), hasRole('Recruiter'));
    return <Navigate to="/user-dashboard" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
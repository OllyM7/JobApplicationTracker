import React from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import {
  HomeIcon,
  BriefcaseIcon,
  UserIcon,
  UsersIcon,
  PresentationChartLineIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const NavItem = ({ to, icon: Icon, children }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-700 hover:text-primary-700 hover:bg-gray-100'
        }`
      }
    >
      <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
      {children}
    </NavLink>
  );
};

const Sidebar = () => {
  const { isAuthenticated, isAdmin, isRecruiter } = React.useContext(AuthContext);

  return (
    <nav className="px-2 py-4 space-y-1">
      {isAuthenticated() && (
        <>
          <NavItem to="/dashboard" icon={HomeIcon}>
            Dashboard
          </NavItem>
          
          <NavItem to="/applications" icon={DocumentTextIcon}>
            Applications
          </NavItem>
          
          <NavItem to="/jobs" icon={BriefcaseIcon}>
            Jobs
          </NavItem>
          
          {isAdmin() && (
            <NavItem to="/admin" icon={PresentationChartLineIcon}>
              Admin Panel
            </NavItem>
          )}
          
          {isRecruiter() && (
            <NavItem to="/recruiter" icon={UsersIcon}>
              Recruiter Portal
            </NavItem>
          )}
          
          <NavItem to="/profile" icon={UserIcon}>
            Profile
          </NavItem>
        </>
      )}
    </nav>
  );
};

export default Sidebar; 
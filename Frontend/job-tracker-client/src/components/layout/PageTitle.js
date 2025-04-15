import React from 'react';
import { useLocation } from 'react-router-dom';

const getPageTitle = (pathname) => {
  const path = pathname.split('/')[1] || 'dashboard';
  
  const titles = {
    'dashboard': 'Dashboard',
    'applications': 'Applications',
    'jobs': 'Jobs',
    'admin': 'Admin Panel',
    'recruiter': 'Recruiter Portal',
    'profile': 'Profile',
    'settings': 'Settings',
  };
  
  return titles[path] || 'Not Found';
};

const PageTitle = ({ className = '' }) => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  
  return (
    <h1 className={`text-2xl font-bold text-gray-900 ${className}`}>
      {title}
    </h1>
  );
};

export default PageTitle; 
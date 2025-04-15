import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import PrivateRoute from './components/routing/PrivateRoute';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import VerifyEmail from './components/auth/VerifyEmail';
import Profile from './components/profile/Profile';
import AdminDashboard from './components/admin/AdminDashboard';
import RecruiterDashboard from './components/recruiter/RecruiterDashboard';
import NotFound from './components/common/NotFound';

// Import new application components
import ApplicationsList from './components/applications/ApplicationsList';
import ApplicationDetail from './components/applications/ApplicationDetail';
import ApplicationForm from './components/applications/ApplicationForm';

// Import job components
import JobListings from './components/jobs/JobListings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Protected routes */}
          <Route element={<Layout />}>
            {/* Root redirect - checks roles and redirects */}
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="/dashboard" element={<RoleBasedRedirect />} />
            
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<Profile />} />
              
              {/* Application routes */}
              <Route path="/applications" element={<ApplicationsList />} />
              <Route path="/applications/new" element={<ApplicationForm />} />
              <Route path="/applications/:id" element={<ApplicationDetail />} />
              <Route path="/applications/:id/edit" element={<ApplicationForm />} />
              
              {/* Job routes */}
              <Route path="/jobs" element={<JobListings />} />
              
              {/* User dashboard - only accessible to regular users */}
              <Route path="/user-dashboard" element={<Dashboard />} />
            </Route>
            
            <Route element={<PrivateRoute roles={['Admin']} />}>
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>
            
            <Route element={<PrivateRoute roles={['Recruiter']} />}>
              <Route path="/recruiter/*" element={<RecruiterDashboard />} />
            </Route>
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Role-based redirect component
const RoleBasedRedirect = () => {
  const auth = React.useContext(AuthContext);
  
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (auth.isAdmin()) {
    return <Navigate to="/admin" replace />;
  }
  
  if (auth.isRecruiter()) {
    return <Navigate to="/recruiter" replace />;
  }
  
  return <Navigate to="/user-dashboard" replace />;
};

export default App;
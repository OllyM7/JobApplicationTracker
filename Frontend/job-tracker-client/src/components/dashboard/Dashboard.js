import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import JobStatusBoard from './JobStatusBoard';
import DashboardStats from './DashboardStats';
import UpcomingDeadlines from './UpcomingDeadlines';
import api from '../../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    interviewing: 0,
    accepted: 0,
    rejected: 0
  });

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await api.get('/applications');
        setApplications(response.data);
        
        // Calculate stats
        const total = response.data.length;
        const applied = response.data.filter(app => app.status === 'Applied').length;
        const interviewing = response.data.filter(app => app.status === 'Interviewing').length;
        const accepted = response.data.filter(app => app.status === 'AwaitingOffer').length;
        const rejected = response.data.filter(app => app.status === 'Rejected').length;
        
        setStats({
          total,
          applied,
          interviewing,
          accepted,
          rejected
        });
        
        setError(null);
      } catch (err) {
        // Handle 404 - new user with no applications yet
        if (err.response && err.response.status === 404) {
          setApplications([]);
          setStats({
            total: 0,
            applied: 0,
            interviewing: 0,
            accepted: 0,
            rejected: 0
          });
          setError(null);
        } else {
          // Handle other errors
          setError('Failed to fetch applications. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status: newStatus });
      
      // Update the local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      // Update stats
      const updatedApplications = applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      );
      
      const total = updatedApplications.length;
      const applied = updatedApplications.filter(app => app.status === 'Applied').length;
      const interviewing = updatedApplications.filter(app => app.status === 'Interviewing').length;
      const accepted = updatedApplications.filter(app => app.status === 'AwaitingOffer').length;
      const rejected = updatedApplications.filter(app => app.status === 'Rejected').length;
      
      setStats({
        total,
        applied,
        interviewing,
        accepted,
        rejected
      });
    } catch (err) {
      setError('Failed to update application status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold text-gray-900">Loading dashboard...</h2>
          <div className="mt-4 flex justify-center">
            <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.email}</h1>
        <p className="text-gray-600">Here's an overview of your job applications</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <DashboardStats stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <JobStatusBoard 
            applications={applications} 
            onStatusChange={handleStatusChange} 
          />
        </div>
        <div>
          <UpcomingDeadlines applications={applications} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
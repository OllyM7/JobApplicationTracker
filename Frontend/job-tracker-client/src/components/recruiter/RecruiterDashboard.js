import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ChartBarIcon,
  BriefcaseIcon,
  UserGroupIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

// Recruiter component for managing job postings
const RecruiterJobs = () => {
  const { user } = React.useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/job-postings/recruiter');
        setJobs(response.data);
      } catch (err) {
        setError('Failed to fetch job postings. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleToggleStatus = async (jobId) => {
    try {
      await api.put(`/job-postings/${jobId}/toggle-status`);
      
      // Update the local state
      setJobs(jobs.map(job => {
        if (job.id === jobId) {
          return {
            ...job,
            isActive: !job.isActive
          };
        }
        return job;
      }));
    } catch (err) {
      setError('Failed to update job status. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/job-postings/${jobId}`);
      
      // Update the local state
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (err) {
      setError('Failed to delete job posting. Please try again.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Your Job Postings</h2>
          <Link 
            to="/recruiter/jobs/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Post New Job
          </Link>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicants
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{job.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{job.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{job.applicantCount || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            job.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {job.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/recruiter/jobs/${job.id}/applicants`} className="text-primary-600 hover:text-primary-900 mr-3">
                          <EyeIcon className="h-5 w-5 inline" />
                        </Link>
                        <Link to={`/recruiter/jobs/${job.id}/edit`} className="text-primary-600 hover:text-primary-900 mr-3">
                          <PencilIcon className="h-5 w-5 inline" />
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(job.id)}
                          className={`text-${job.isActive ? 'yellow' : 'green'}-600 hover:text-${job.isActive ? 'yellow' : 'green'}-900 mr-3`}
                        >
                          {job.isActive ? 
                            <XMarkIcon className="h-5 w-5 inline text-yellow-600" /> : 
                            <CheckIcon className="h-5 w-5 inline text-green-600" />
                          }
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No job postings found. <Link to="/recruiter/jobs/new" className="text-primary-600 hover:text-primary-900">Create your first job posting</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recruiter component for viewing applicants for a specific job
const RecruiterApplicants = () => {
  const { id } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setLoading(true);
        const [applicantsResponse, jobResponse] = await Promise.all([
          api.get(`/job-postings/${id}/applicants`),
          api.get(`/job-postings/${id}`)
        ]);
        setApplicants(applicantsResponse.data);
        setJob(jobResponse.data);
      } catch (err) {
        setError('Failed to fetch applicants. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <Link to="/recruiter/jobs" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Jobs
        </Link>
      </div>
      
      {job && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Applicants for {job.title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {job.company} • {job.location}
            </p>
          </div>
          <div className="border-t border-gray-200">
            {applicants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applicants.map((applicant) => (
                      <tr key={applicant.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <UserGroupIcon className="h-6 w-6 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{applicant.userName}</div>
                              <div className="text-sm text-gray-500">{applicant.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{new Date(applicant.applicationDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              {
                                'Pending': 'bg-yellow-100 text-yellow-800',
                                'Reviewing': 'bg-blue-100 text-blue-800',
                                'Interviewing': 'bg-indigo-100 text-indigo-800',
                                'Accepted': 'bg-green-100 text-green-800',
                                'Rejected': 'bg-red-100 text-red-800'
                              }[applicant.status] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {applicant.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link to={`/recruiter/applicants/${applicant.id}`} className="text-primary-600 hover:text-primary-900">
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-4 text-center text-sm text-gray-500">
                No applications received yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Recruiter dashboard overview with stats
const RecruiterOverview = () => {
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplicants: 0,
    interviewsScheduled: 0
  });
  const [recentApplicants, setRecentApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // These would be actual API calls in a real implementation
        const [jobsResponse, applicantsResponse] = await Promise.all([
          api.get('/job-postings/recruiter'),
          api.get('/job-postings/recruiter/recent-applicants')
        ]);
        
        // Calculate stats from response data
        const activeJobs = jobsResponse.data.filter(job => job.isActive).length;
        const totalApplicants = jobsResponse.data.reduce((sum, job) => sum + (job.applicantCount || 0), 0);
        
        setStats({
          activeJobs,
          totalApplicants,
          interviewsScheduled: 12 // This would come from a real API
        });
        
        setRecentApplicants(applicantsResponse.data || []);
      } catch (err) {
        setError('Failed to fetch recruiter dashboard data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Recruiter Overview</h2>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-700">Active Jobs</h3>
              <p className="text-3xl font-bold text-blue-900 mt-2">{stats.activeJobs}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-green-700">Total Applicants</h3>
              <p className="text-3xl font-bold text-green-900 mt-2">{stats.totalApplicants}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-700">Interviews Scheduled</h3>
              <p className="text-3xl font-bold text-purple-900 mt-2">{stats.interviewsScheduled}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Applicants</h2>
        </div>
        <div className="border-t border-gray-200">
          {recentApplicants.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recentApplicants.map((applicant) => (
                <li key={applicant.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserGroupIcon className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{applicant.userName}</div>
                        <div className="text-sm text-gray-500">{applicant.jobTitle}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        Applied {new Date(applicant.applicationDate).toLocaleDateString()}
                      </div>
                      <Link to={`/recruiter/applicants/${applicant.id}`} className="text-sm text-primary-600 hover:text-primary-900">
                        Review
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-5 sm:px-6 text-center text-sm text-gray-500">
              No recent applications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Recruiter Dashboard component with routing
const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Map of tab IDs to components
  const tabComponents = {
    'overview': <RecruiterOverview />,
    'jobs': <RecruiterJobs />
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
        <p className="text-gray-600">Manage job postings and applicants</p>
      </div>
      
      <div className="bg-white shadow">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select a tab</label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="overview">Overview</option>
            <option value="jobs">Jobs</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`${
                activeTab === 'jobs'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
            >
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              Job Postings
            </button>
          </nav>
        </div>
      </div>
      
      <div>
        {tabComponents[activeTab]}
      </div>
    </div>
  );
};

export default RecruiterDashboard; 
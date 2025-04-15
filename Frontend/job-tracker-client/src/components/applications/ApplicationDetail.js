import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  BriefcaseIcon, 
  DocumentTextIcon,
  ChevronLeftIcon,
  PencilIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon as ExternalLinkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../../utils/api';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/applications/${id}`);
        setApplication(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch application. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/applications/${id}`);
      navigate('/applications');
    } catch (err) {
      setError('Failed to delete application. Please try again later.');
      setDeleting(false);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    
    try {
      await api.put(`/applications/${id}/status`, { status: newStatus });
      setApplication(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      setError('Failed to update application status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold text-gray-900">Loading application...</h2>
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

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">Application not found.</span>
      </div>
    );
  }

  const statusConfig = {
    'ApplicationNeeded': { title: 'To Apply', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'Applied': { title: 'Applied', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'ExamCenter': { title: 'Exam', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    'Interviewing': { title: 'Interviewing', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    'AwaitingOffer': { title: 'Offer', color: 'bg-green-100 text-green-800 border-green-200' },
    'Rejected': { title: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' }
  };

  const status = statusConfig[application.status] || statusConfig['Applied'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link to="/applications" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          Back to Applications
        </Link>
        <div className="flex space-x-3">
          <Link to={`/applications/${id}/edit`} className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{application.position}</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{application.companyName}</p>
          </div>
          <div className={`px-3 py-1 rounded-full ${status.color}`}>
            <select
              value={application.status}
              onChange={handleStatusChange}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            >
              {Object.keys(statusConfig).map((statusKey) => (
                <option key={statusKey} value={statusKey}>
                  {statusConfig[statusKey].title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                <div className="flex items-center">
                  <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
                  Company
                </div>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {application.companyName}
                {application.companyWebsite && (
                  <a 
                    href={application.companyWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-primary-600 hover:text-primary-900 inline-flex items-center"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                  </a>
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                  Position
                </div>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{application.position}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  Application Date
                </div>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(application.applicationDate).toLocaleDateString()}
              </dd>
            </div>
            {application.deadline && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                    Deadline
                  </div>
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(application.deadline).toLocaleDateString()}
                  {new Date(application.deadline) < new Date() && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Passed
                    </span>
                  )}
                </dd>
              </div>
            )}
            {application.jobUrl && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Job URL</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <a 
                    href={application.jobUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                  >
                    {application.jobUrl}
                    <ExternalLinkIcon className="h-4 w-4 ml-1" />
                  </a>
                </dd>
              </div>
            )}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                {application.notes || 'No notes added.'}
              </dd>
            </div>
            
            {application.recruiterFeedback && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Recruiter Feedback</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                  {application.recruiterFeedback}
                </dd>
              </div>
            )}
            
            {application.coverLetter && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Cover Letter</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                  {application.coverLetter}
                </dd>
              </div>
            )}
            
            {application.cvFilePath && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Resume/CV</dt>
                <dd className="mt-1 text-sm text-primary-600 sm:mt-0 sm:col-span-2">
                  <a 
                    href={application.cvFilePath} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    Download Resume/CV
                    <ExternalLinkIcon className="h-4 w-4 ml-1" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      {/* Activity Timeline */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Activity Timeline</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Timeline of actions and status changes</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flow-root">
            <ul className="-mb-8">
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                        <CalendarIcon className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">Applied to <span className="font-medium text-gray-900">{application.position}</span> at <span className="font-medium text-gray-900">{application.companyName}</span></p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {new Date(application.applicationDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              
              {application.recruiterResponseDate && (
                <li>
                  <div className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                          <BriefcaseIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">Recruiter responded with status: <span className="font-medium text-gray-900">{application.recruiterStatus}</span></p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {new Date(application.recruiterResponseDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail; 
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  BriefcaseIcon, 
  FunnelIcon as FilterIcon,
  ArrowsUpDownIcon as SortAscendingIcon,
  MagnifyingGlassIcon as SearchIcon
} from '@heroicons/react/24/outline';
import api from '../../utils/api';

const ApplicationStatus = ({ status }) => {
  const statusConfig = {
    'ApplicationNeeded': { label: 'To Apply', color: 'bg-yellow-100 text-yellow-800' },
    'Applied': { label: 'Applied', color: 'bg-blue-100 text-blue-800' },
    'ExamCenter': { label: 'Exam', color: 'bg-purple-100 text-purple-800' },
    'Interviewing': { label: 'Interviewing', color: 'bg-indigo-100 text-indigo-800' },
    'AwaitingOffer': { label: 'Offer', color: 'bg-green-100 text-green-800' },
    'Rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800' }
  };

  const config = statusConfig[status] || statusConfig['Applied'];
  
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
};

const ApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('applicationDate');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await api.get('/applications');
        setApplications(response.data);
        setError(null);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setApplications([]);
          setError(null);
        } else {
          setError('Failed to fetch applications. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Filter applications based on search term and filter
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.companyName.toLowerCase().includes(search.toLowerCase()) ||
      app.position.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'All' || app.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  // Sort applications
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let valueA, valueB;
    
    if (sortBy === 'companyName' || sortBy === 'position') {
      valueA = a[sortBy].toLowerCase();
      valueB = b[sortBy].toLowerCase();
    } else if (sortBy === 'applicationDate' || sortBy === 'deadline') {
      valueA = new Date(a[sortBy]);
      valueB = new Date(b[sortBy]);
    } else {
      valueA = a[sortBy];
      valueB = b[sortBy];
    }
    
    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold text-gray-900">Loading applications...</h2>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600">Manage and track your job applications</p>
        </div>
        
        <Link to="/applications/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          Add Application
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="w-full md:w-1/3 relative">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 py-2 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <SearchIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <FilterIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={filter}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="ApplicationNeeded">To Apply</option>
                  <option value="Applied">Applied</option>
                  <option value="ExamCenter">Exam</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="AwaitingOffer">Offers</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleSortDirection}
                  className="text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                  <SortAscendingIcon className="h-5 w-5" />
                </button>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="applicationDate">Date Applied</option>
                  <option value="deadline">Deadline</option>
                  <option value="companyName">Company</option>
                  <option value="position">Position</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedApplications.length > 0 ? (
                sortedApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{app.companyName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{app.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ApplicationStatus status={app.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {new Date(app.applicationDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.deadline && (
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {new Date(app.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/applications/${app.id}`} className="text-primary-600 hover:text-primary-900 mr-4">
                        View
                      </Link>
                      <Link to={`/applications/${app.id}/edit`} className="text-primary-600 hover:text-primary-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No applications found. <Link to="/applications/new" className="text-primary-600 hover:text-primary-900">Create your first application</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsList; 
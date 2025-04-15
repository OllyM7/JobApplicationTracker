import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  BriefcaseIcon, 
  MapPinIcon,
  MagnifyingGlassIcon as SearchIcon,
  FunnelIcon as FilterIcon,
  ArrowsUpDownIcon as SortAscendingIcon
} from '@heroicons/react/24/outline';
import api from '../../utils/api';

const JobListings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('postedDate');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/job-postings');
        setJobs(response.data);
        setError(null);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setJobs([]);
          setError(null);
        } else {
          setError('Failed to fetch job listings. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
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

  // Filter jobs based on search term and filter
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'All' || job.jobType === filter;
    
    return matchesSearch && matchesFilter;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let valueA, valueB;
    
    if (sortBy === 'title' || sortBy === 'company' || sortBy === 'location') {
      valueA = a[sortBy].toLowerCase();
      valueB = b[sortBy].toLowerCase();
    } else if (sortBy === 'postedDate' || sortBy === 'applicationDeadline') {
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
          <h2 className="text-2xl font-bold text-gray-900">Loading job listings...</h2>
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
        <h1 className="text-2xl font-bold text-gray-900">Job Listings</h1>
        <p className="text-gray-600">Browse available job opportunities</p>
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
                placeholder="Search jobs..."
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
                  <option value="All">All Types</option>
                  <option value="FullTime">Full Time</option>
                  <option value="PartTime">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
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
                  <option value="postedDate">Date Posted</option>
                  <option value="applicationDeadline">Application Deadline</option>
                  <option value="company">Company</option>
                  <option value="title">Position Title</option>
                  <option value="location">Location</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow divide-y divide-gray-200">
          {sortedJobs.length > 0 ? (
            sortedJobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {job.jobType}
                  </span>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <BriefcaseIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {job.company}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      <MapPinIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {job.location}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <p>
                      Posted <time dateTime={job.postedDate}>{new Date(job.postedDate).toLocaleDateString()}</time>
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 line-clamp-2">{job.description}</p>
                </div>
                <div className="mt-5 flex">
                  <Link to={`/jobs/${job.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-500">
                    View Details<span aria-hidden="true"> &rarr;</span>
                  </Link>
                  <span className="mx-2 text-gray-500">•</span>
                  <Link 
                    to={`/applications/new?jobId=${job.id}`} 
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No job listings found. Check back later for new opportunities.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobListings; 
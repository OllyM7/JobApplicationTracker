import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const statusConfig = {
  'ApplicationNeeded': {
    title: 'Need to Apply',
    color: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    icon: ClockIcon,
    iconColor: 'text-yellow-500'
  },
  'Applied': {
    title: 'Applied',
    color: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: ChevronRightIcon,
    iconColor: 'text-blue-500'
  },
  'ExamCenter': {
    title: 'Exam',
    color: 'bg-purple-100',
    borderColor: 'border-purple-300',
    icon: ClockIcon,
    iconColor: 'text-purple-500'
  },
  'Interviewing': {
    title: 'Interviewing',
    color: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    icon: ChevronRightIcon,
    iconColor: 'text-indigo-500'
  },
  'AwaitingOffer': {
    title: 'Offer',
    color: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: CheckCircleIcon,
    iconColor: 'text-green-500'
  },
  'Rejected': {
    title: 'Rejected',
    color: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: XCircleIcon,
    iconColor: 'text-red-500'
  }
};

const JobCard = ({ application, onStatusChange }) => {
  const status = statusConfig[application.status] || statusConfig['Applied'];
  const Icon = status.icon;
  
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    onStatusChange(application.id, newStatus);
  };
  
  return (
    <div className={`p-4 rounded-lg ${status.color} border ${status.borderColor} mb-3`}>
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-gray-900 truncate">{application.companyName}</h3>
        <Icon className={`h-5 w-5 ${status.iconColor}`} />
      </div>
      <div className="mt-1 text-sm text-gray-600 truncate">{application.position}</div>
      
      <div className="mt-3 flex items-center text-xs text-gray-500">
        <span>
          {new Date(application.applicationDate).toLocaleDateString()}
        </span>
        {application.deadline && (
          <span className="ml-2 bg-white px-2 py-0.5 rounded-full text-xs flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" />
            Due: {new Date(application.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <Link to={`/applications/${application.id}`} className="text-sm text-primary-600 hover:text-primary-700">
          View details
        </Link>
        
        <select 
          value={application.status}
          onChange={handleStatusChange}
          className="text-xs rounded-md border-gray-300 text-gray-700 focus:ring-primary-500 focus:border-primary-500"
        >
          {Object.keys(statusConfig).map(status => (
            <option key={status} value={status}>
              {statusConfig[status].title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const StatusColumn = ({ title, applications, color, onStatusChange }) => {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <h3 className={`text-sm font-medium ${color} mb-3 px-3 py-1 rounded-md inline-block`}>
        {title} ({applications.length})
      </h3>
      <div className="space-y-3">
        {applications.map(application => (
          <JobCard 
            key={application.id} 
            application={application} 
            onStatusChange={onStatusChange} 
          />
        ))}
        
        {applications.length === 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            No applications in this status
          </div>
        )}
      </div>
    </div>
  );
};

const JobStatusBoard = ({ applications, onStatusChange }) => {
  // Group applications by status
  const applicationsByStatus = {
    'ApplicationNeeded': applications.filter(app => app.status === 'ApplicationNeeded'),
    'Applied': applications.filter(app => app.status === 'Applied'),
    'ExamCenter': applications.filter(app => app.status === 'ExamCenter'),
    'Interviewing': applications.filter(app => app.status === 'Interviewing'),
    'AwaitingOffer': applications.filter(app => app.status === 'AwaitingOffer'),
    'Rejected': applications.filter(app => app.status === 'Rejected')
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Your Applications</h2>
        <p className="text-sm text-gray-500">Drag applications between columns to update their status</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 p-4 overflow-x-auto">
        <StatusColumn 
          title="To Apply" 
          applications={applicationsByStatus['ApplicationNeeded']}
          color="text-yellow-800 bg-yellow-100" 
          onStatusChange={onStatusChange} 
        />
        
        <StatusColumn 
          title="Applied" 
          applications={[...applicationsByStatus['Applied'], ...applicationsByStatus['ExamCenter']]}
          color="text-blue-800 bg-blue-100" 
          onStatusChange={onStatusChange} 
        />
        
        <StatusColumn 
          title="Interviewing" 
          applications={applicationsByStatus['Interviewing']}
          color="text-indigo-800 bg-indigo-100" 
          onStatusChange={onStatusChange} 
        />
        
        <StatusColumn 
          title="Offers" 
          applications={applicationsByStatus['AwaitingOffer']}
          color="text-green-800 bg-green-100" 
          onStatusChange={onStatusChange} 
        />
        
        <StatusColumn 
          title="Rejected" 
          applications={applicationsByStatus['Rejected']}
          color="text-red-800 bg-red-100" 
          onStatusChange={onStatusChange} 
        />
      </div>
    </div>
  );
};

export default JobStatusBoard; 
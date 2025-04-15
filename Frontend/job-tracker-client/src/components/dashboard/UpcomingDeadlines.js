import React from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const getDateDifference = (deadlineDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadline = new Date(deadlineDate);
  deadline.setHours(0, 0, 0, 0);
  
  const differenceInTime = deadline.getTime() - today.getTime();
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
  
  return differenceInDays;
};

const DeadlineItem = ({ application }) => {
  const daysLeft = getDateDifference(application.deadline);
  
  let statusClass = "text-gray-600";
  let urgencyIndicator = null;
  
  if (daysLeft <= 0) {
    statusClass = "text-red-600";
    urgencyIndicator = (
      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
    );
  } else if (daysLeft <= 3) {
    statusClass = "text-orange-600";
    urgencyIndicator = (
      <ExclamationCircleIcon className="h-5 w-5 text-orange-500" />
    );
  }
  
  return (
    <li className="py-3">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <ClockIcon className="h-6 w-6 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {application.companyName}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {application.position}
          </p>
        </div>
        <div className="flex items-center">
          {urgencyIndicator}
          <div className={`text-sm font-medium ${statusClass}`}>
            {daysLeft <= 0 ? 'Due today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
          </div>
        </div>
      </div>
    </li>
  );
};

const UpcomingDeadlines = ({ applications }) => {
  // Filter applications with deadlines
  const applicationsWithDeadlines = applications.filter(
    app => app.deadline && new Date(app.deadline) >= new Date()
  );
  
  // Sort by deadline (closest first)
  const sortedApplications = [...applicationsWithDeadlines].sort((a, b) => {
    return new Date(a.deadline) - new Date(b.deadline);
  });
  
  // Take only the next 5 deadlines
  const upcomingDeadlines = sortedApplications.slice(0, 5);
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Upcoming Deadlines</h2>
      </div>
      
      {upcomingDeadlines.length > 0 ? (
        <ul className="divide-y divide-gray-200 px-4">
          {upcomingDeadlines.map(application => (
            <DeadlineItem 
              key={application.id} 
              application={application} 
            />
          ))}
        </ul>
      ) : (
        <div className="p-4 text-center text-sm text-gray-500">
          No upcoming deadlines
        </div>
      )}
      
      <div className="bg-gray-50 px-4 py-3 text-right">
        <Link to="/applications" className="text-sm font-medium text-primary-600 hover:text-primary-500">
          View all applications
        </Link>
      </div>
    </div>
  );
};

export default UpcomingDeadlines; 
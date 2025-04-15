import React, { useState, useEffect } from 'react';
import { 
  DocumentPlusIcon, 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon, 
  ArchiveBoxIcon,
  FaceSmileIcon,
  BriefcaseIcon,
  DocumentCheckIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  DocumentPlusIcon as SolidDocumentPlusIcon, 
  PaperAirplaneIcon as SolidPaperAirplaneIcon, 
  ChatBubbleLeftRightIcon as SolidChatBubbleLeftRightIcon, 
  ArchiveBoxIcon as SolidArchiveBoxIcon,
  FaceSmileIcon as SolidFaceSmileIcon
} from '@heroicons/react/24/solid';
import api from '../../utils/api';

const StatCard = ({ title, value, icon: Icon, bgColor, textColor }) => {
  return (
    <div className={`${bgColor} rounded-lg shadow-sm p-4`}>
      <div className="flex items-center">
        <div className={`${textColor} p-3 rounded-full mr-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
      </div>
    </div>
  );
};

const DashboardStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard 
        title="Total Applications" 
        value={stats.total} 
        icon={SolidDocumentPlusIcon} 
        bgColor="bg-white" 
        textColor="bg-gray-100 text-gray-700"
      />
      
      <StatCard 
        title="Applied" 
        value={stats.applied} 
        icon={SolidPaperAirplaneIcon} 
        bgColor="bg-white" 
        textColor="bg-blue-100 text-blue-700"
      />
      
      <StatCard 
        title="Interviewing" 
        value={stats.interviewing} 
        icon={SolidChatBubbleLeftRightIcon} 
        bgColor="bg-white" 
        textColor="bg-indigo-100 text-indigo-700"
      />
      
      <StatCard 
        title="Offers" 
        value={stats.accepted} 
        icon={SolidFaceSmileIcon} 
        bgColor="bg-white" 
        textColor="bg-green-100 text-green-700"
      />
      
      <StatCard 
        title="Rejected" 
        value={stats.rejected} 
        icon={SolidArchiveBoxIcon} 
        bgColor="bg-white" 
        textColor="bg-red-100 text-red-700"
      />
    </div>
  );
};

export default DashboardStats; 
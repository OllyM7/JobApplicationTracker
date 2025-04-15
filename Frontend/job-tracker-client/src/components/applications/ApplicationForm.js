import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeftIcon, 
  DocumentArrowUpIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../utils/api';

const ApplicationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyWebsite: '',
    position: '',
    jobUrl: '',
    status: 'Applied',
    deadline: '',
    applicationDate: new Date().toISOString().slice(0, 10),
    notes: '',
    coverLetter: '',
    cvFile: null
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (isEditing) {
      const fetchApplication = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/applications/${id}`);
          
          // Format dates for input fields
          const application = {
            ...response.data,
            applicationDate: response.data.applicationDate ? new Date(response.data.applicationDate).toISOString().slice(0, 10) : '',
            deadline: response.data.deadline ? new Date(response.data.deadline).toISOString().slice(0, 10) : ''
          };
          
          setFormData(application);
          setError(null);
        } catch (err) {
          setError('Failed to fetch application. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      fetchApplication();
    }
  }, [id, isEditing]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
    }
    
    if (formData.companyWebsite && !/^https?:\/\//.test(formData.companyWebsite)) {
      newErrors.companyWebsite = 'Website must start with http:// or https://';
    }
    
    if (formData.jobUrl && !/^https?:\/\//.test(formData.jobUrl)) {
      newErrors.jobUrl = 'Job URL must start with http:// or https://';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      cvFile: e.target.files[0]
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const formDataToSend = new FormData();
      
      // Add all form fields to the FormData
      Object.keys(formData).forEach(key => {
        if (key === 'cvFile') {
          if (formData.cvFile) {
            formDataToSend.append('cvFile', formData.cvFile);
          }
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      if (isEditing) {
        await api.put(`/applications/${id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        navigate(`/applications/${id}`);
      } else {
        const response = await api.post('/applications', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        navigate(`/applications/${response.data.id}`);
      }
    } catch (err) {
      setError('Failed to save application. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
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
        <Link
          to={isEditing ? `/applications/${id}` : "/applications"}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          {isEditing ? 'Back to Application Details' : 'Back to Applications'}
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edit Application' : 'Add New Application'}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {isEditing 
              ? 'Update your job application details' 
              : 'Fill in the details of your job application'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-6 mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    name="companyName"
                    id="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.companyName ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {errors.companyName && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                  )}
                </div>
                {errors.companyName && (
                  <p className="mt-2 text-sm text-red-600">{errors.companyName}</p>
                )}
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">
                  Company Website
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    name="companyWebsite"
                    id="companyWebsite"
                    placeholder="https://example.com"
                    value={formData.companyWebsite || ''}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.companyWebsite ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {errors.companyWebsite && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                  )}
                </div>
                {errors.companyWebsite && (
                  <p className="mt-2 text-sm text-red-600">{errors.companyWebsite}</p>
                )}
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                  Position *
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    name="position"
                    id="position"
                    required
                    value={formData.position}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.position ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {errors.position && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                  )}
                </div>
                {errors.position && (
                  <p className="mt-2 text-sm text-red-600">{errors.position}</p>
                )}
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-700">
                  Job URL
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    name="jobUrl"
                    id="jobUrl"
                    placeholder="https://example.com/jobs/12345"
                    value={formData.jobUrl || ''}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.jobUrl ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {errors.jobUrl && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                  )}
                </div>
                {errors.jobUrl && (
                  <p className="mt-2 text-sm text-red-600">{errors.jobUrl}</p>
                )}
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="ApplicationNeeded">To Apply</option>
                    <option value="Applied">Applied</option>
                    <option value="ExamCenter">Exam</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="AwaitingOffer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="applicationDate" className="block text-sm font-medium text-gray-700">
                  Application Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="applicationDate"
                    id="applicationDate"
                    value={formData.applicationDate}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                  Deadline
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="deadline"
                    id="deadline"
                    value={formData.deadline || ''}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <div className="mt-1">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Add any notes about the application, interview details, etc."
                  />
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
                  Cover Letter
                </label>
                <div className="mt-1">
                  <textarea
                    id="coverLetter"
                    name="coverLetter"
                    rows={5}
                    value={formData.coverLetter || ''}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Paste your cover letter text here"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Resume/CV</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="cvFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="cvFile"
                          name="cvFile"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                    {formData.cvFile && (
                      <p className="text-sm text-gray-900">Selected: {formData.cvFile.name}</p>
                    )}
                    {formData.cvFilePath && !formData.cvFile && (
                      <p className="text-sm text-gray-900">Current: {formData.cvFilePath.split('/').pop()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-5">
              <div className="flex justify-end">
                <Link
                  to={isEditing ? `/applications/${id}` : "/applications"}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm; 
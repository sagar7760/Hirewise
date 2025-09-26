import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';

const ApplicationsPage = () => {
  const { apiRequest } = useAuth();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [currentPage, statusFilter]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (statusFilter) params.append('status', statusFilter);

      const response = await apiRequest(`/api/applicant/applications?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        setPagination(data.pagination || {});
      } else {
        console.error('Failed to fetch applications:', response.status);
        setApplications([]);
        setPagination({});
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    // Light Mode | Dark Mode
    const colors = {
      'submitted': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-700',
      'under_review': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700',
      'shortlisted': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700',
      'interview_scheduled': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700',
      'interviewed': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700',
      'offer_extended': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-300 dark:border-green-600 shadow-sm',
      'offer_accepted': 'bg-green-600 dark:bg-green-800 text-white dark:text-white border border-green-700 dark:border-green-600 shadow-md',
      'offer_declined': 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600',
      'rejected': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700',
      'withdrawn': 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
  };

  const getStatusText = (status) => {
    const texts = {
      'submitted': 'Awaiting Recruiter Response',
      'under_review': 'Application Under Review',
      'shortlisted': 'Shortlisted for Next Round',
      'interview_scheduled': 'Interview Scheduled',
      'interviewed': 'Interview Completed',
      'offer_extended': 'Job Offer Received',
      'offer_accepted': 'Offer Accepted',
      'offer_declined': 'Offer Declined',
      'rejected': 'Application Rejected',
      'withdrawn': 'Application Withdrawn'
    };
    return texts[status] || status;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">
                My Applications
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto']">
                Track your job application status and progress
              </p>
            </div>
            
            {/* Status Filter */}
            <div className="mt-4 sm:mt-0">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
              >
                <option value="">All Applications</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="interviewed">Interviewed</option>
                <option value="offer_extended">Offer Extended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors duration-300">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white font-['Open_Sans'] mb-2">
              No applications found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] mb-6">
              {statusFilter ? 
                `No applications with status "${getStatusText(statusFilter)}" found.` :
                "You haven't applied to any jobs yet. Start exploring opportunities!"
              }
            </p>
            <Link
              to="/jobs"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 dark:text-black transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <div key={application._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {application.job?.company?.logo && (
                        <img 
                          src={application.job.company.logo} 
                          alt={application.job.company.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans']">
                          {application.job?.title || 'Job Title Not Available'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">
                          {application.job?.company?.name || 'Company Not Available'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-['Roboto'] mb-4">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {application.job?.location || 'Location not specified'}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Applied {new Date(application.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                        {application.job?.jobType || 'Type not specified'}
                      </span>
                    </div>

                    {/* Skills */}
                    {application.skills && application.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {application.skills.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-300"
                          >
                            {skill}
                          </span>
                        ))}
                        {application.skills.length > 5 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-300">
                            +{application.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Salary Range */}
                    {application.expectedSalary?.min && application.expectedSalary?.max && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto'] mb-3">
                        Expected: ${application.expectedSalary.min.toLocaleString()} - ${application.expectedSalary.max.toLocaleString()} {application.expectedSalary.currency || 'USD'}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-3">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {getStatusText(application.status)}
                    </span>
                    
                    <div className="flex space-x-2">
                      {application.job?._id ? (
                        <Link
                          to={`/jobs/${application.job._id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
                        >
                          View Job Details
                        </Link>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 cursor-not-allowed transition-colors duration-300">
                          Job Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300 font-['Roboto']">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.totalApplications)} of {pagination.totalApplications} applications
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPrevPage}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                  pagination.hasPrevPage
                    ? 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 cursor-not-allowed'
                }`}
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Page {currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={!pagination.hasNextPage}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                  pagination.hasNextPage
                    ? 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ApplicationsPage;
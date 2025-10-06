import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApiRequest } from '../../hooks/useApiRequest';
import HRLayout from '../../components/layout/HRLayout';

const HRJobApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { makeJsonRequest } = useApiRequest();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchJobAndApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch job details
        const jobResponse = await makeJsonRequest(`/api/hr/jobs/${jobId}`);
        if (jobResponse.success) {
          setJob(jobResponse.data);
        }
        
        // Fetch applications for this job
        const appsResponse = await makeJsonRequest(`/api/hr/jobs/${jobId}/applications`);
        if (appsResponse.success) {
          setApplications(appsResponse.data.applications || []);
        }
        
      } catch (error) {
        console.error('Error fetching job applications:', error);
        setError(error.message || 'Failed to fetch job applications');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobAndApplications();
    }
  }, [jobId, makeJsonRequest]);

  if (loading) {
    return (
      <HRLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300 font-['Roboto']">Loading applications...</span>
          </div>
        </div>
      </HRLayout>
    );
  }

  if (error) {
    return (
      <HRLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 transition-colors duration-300">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400 dark:text-red-300 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300 font-['Roboto']">Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400 font-['Roboto']">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/hr/jobs')}
                    className="text-sm bg-red-100 dark:bg-red-700 text-red-800 dark:text-white px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-600 transition-colors"
                  >
                    Back to Jobs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HRLayout>
    );
  }
  
  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'shortlisted':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'under_review':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'interview_scheduled':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300';
    }
  };

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">
                Applications for {job?.title || 'Job'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
                Manage applications for this job posting
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                to={`/hr/jobs/${jobId}/edit`}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Job
              </Link>
              <button
                onClick={() => navigate('/hr/jobs')}
                className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Jobs
              </button>
            </div>
          </div>
          
          {/* Job Info */}
          {job && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors duration-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Department:</span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">{job.department}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Type:</span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">{job.jobType}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Location:</span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">{job.location}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Status:</span>
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    job.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                    job.status === 'draft' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                    'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Job-Specific Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Applications */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="text-2xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">{Array.isArray(applications) ? applications.length : 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Total Applications</div>
          </div>
          {/* Shortlisted */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-['Open_Sans']">
              {Array.isArray(applications) ? applications.filter(app => app.status === 'shortlisted').length : 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Shortlisted</div>
          </div>
          {/* Under Review */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 font-['Open_Sans']">
              {Array.isArray(applications) ? applications.filter(app => app.status === 'under_review').length : 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Under Review</div>
          </div>
          {/* Rejected */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-['Open_Sans']">
              {Array.isArray(applications) ? applications.filter(app => app.status === 'rejected').length : 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">Rejected</div>
          </div>
        </div>

        {/* Quick Actions */}
        {Array.isArray(applications) && applications.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white font-['Open_Sans']">Quick Actions</h3>
              <div className="flex space-x-3">
                <button className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                  Bulk Shortlist
                </button>
                <button className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Export Applications
                </button>
                <Link
                  to={`/hr/applications?job=${jobId}`}
                  className="text-sm bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Advanced View
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Applications Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
          {!Array.isArray(applications) || applications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">No applications yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                Applications for this job will appear here once candidates start applying.
              </p>
              <div className="mt-6 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">
                  Make sure your job is published and visible to candidates.
                </p>
                <div className="flex justify-center space-x-3">
                  <Link
                    to={`/hr/jobs/${jobId}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Edit Job
                  </Link>
                  <Link
                    to="/hr/jobs"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 dark:text-black transition-colors"
                  >
                    Back to Jobs
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.isArray(applications) && applications.map((application, index) => (
                    <tr key={application.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 font-['Open_Sans']">
                              {(application.candidateName || application.applicant?.name || 'N/A').split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">
                              {application.candidateName || application.applicant?.name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                              {application.applicant?.email || 'No email provided'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-['Roboto']">
                          {new Date(application.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                          {new Date(application.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                          {application.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Submitted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {application.status === 'under_review' && (
                            <>
                              <button
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                                title="Shortlist"
                              >
                                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                                title="Reject"
                              >
                                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </HRLayout>
  );
};

export default HRJobApplications;
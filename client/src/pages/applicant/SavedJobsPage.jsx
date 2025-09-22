import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';

const SavedJobsPage = () => {
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingJobId, setRemovingJobId] = useState(null);

  // Load saved jobs on component mount
  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest('/api/applicant/saved-jobs', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSavedJobs(data.data || []);
        } else {
          setError(data.message || 'Failed to load saved jobs');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to load saved jobs');
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      setError('Failed to load saved jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleApply = (e, jobId) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/jobs/${jobId}/apply`);
  };

  const handleRemoveFromSaved = async (e, jobId) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      setRemovingJobId(jobId);
      
      const response = await apiRequest(`/api/applicant/saved-jobs/${jobId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Remove the job from the local state
          setSavedJobs(prev => prev.filter(job => job.id !== jobId));
        } else {
          setError(data.message || 'Failed to remove job from saved');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to remove job from saved');
      }
    } catch (error) {
      console.error('Error removing saved job:', error);
      setError('Failed to remove job. Please try again.');
    } finally {
      setRemovingJobId(null);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return '1 day ago';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      } else {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
      }
    } catch (error) {
      return 'Recently';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
            Saved Jobs
          </h1>
          <p className="text-gray-600 font-['Roboto']">
            Jobs you've bookmarked for later review
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white border border-red-200 rounded-lg p-12 text-center">
            <div className="text-red-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 font-['Open_Sans'] mb-2">
              Failed to load saved jobs
            </h3>
            <p className="text-gray-600 font-['Roboto'] mb-4">
              {error}
            </p>
            <button
              onClick={loadSavedJobs}
              className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Saved Jobs List */}
        {!loading && !error && (
          <div className="space-y-4">
            {savedJobs.length > 0 ? (
              savedJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleJobClick(job.id)}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">
                          {job.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 font-['Roboto']">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Saved {formatDate(job.savedAt)}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 font-['Roboto']">
                          Posted {formatDate(job.postedDate)}
                        </p>
                        <p className="text-sm text-gray-600 font-['Roboto']">
                          {job.company} • {job.location} • {job.workType}
                        </p>
                        <p className="text-sm text-gray-600 font-['Roboto']">
                          {job.jobType} • {job.experience} Level • {job.salary}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex items-center space-x-2">
                      <button
                        onClick={(e) => handleApply(e, job.id)}
                        className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        onClick={(e) => handleRemoveFromSaved(e, job.id)}
                        disabled={removingJobId === job.id}
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors disabled:opacity-50"
                        title="Remove from saved"
                      >
                        {removingJobId === job.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            Removing...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 font-['Open_Sans'] mb-2">
                  No saved jobs yet
                </h3>
                <p className="text-gray-600 font-['Roboto'] mb-4">
                  Browse jobs and click the heart icon to save them for later.
                </p>
                <button
                  onClick={() => navigate('/jobs')}
                  className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                >
                  Browse Jobs
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SavedJobsPage;
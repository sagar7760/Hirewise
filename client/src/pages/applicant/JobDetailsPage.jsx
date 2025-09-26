import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { CACHE_PREFIXES, CACHE_DURATIONS } from '../../utils/cacheUtils';
import { smartCacheSet, clearExpiredCache } from '../../utils/cacheManager';

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache management for job details
  const CACHE_DURATION = CACHE_DURATIONS.JOB_DETAILS;
  const JOB_CACHE_KEY_PREFIX = CACHE_PREFIXES.JOB_DETAILS;

  // Load job from cache
  const loadJobFromCache = (jobId) => {
    try {
      const cacheKey = JOB_CACHE_KEY_PREFIX + jobId;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = new Date().getTime();
        
        // Check if cache is still valid
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          return parsedCache.data;
        } else {
          // Remove expired cache
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error loading job from cache:', error);
      // Remove corrupted cache
      localStorage.removeItem(JOB_CACHE_KEY_PREFIX + jobId);
    }
    return null;
  };

  // Save job to cache
  const saveJobToCache = (jobId, jobData) => {
    const cacheKey = JOB_CACHE_KEY_PREFIX + jobId;
    const cacheData = {
      timestamp: new Date().getTime(),
      data: jobData
    };
    
    // Use smart cache setter with aggressive cleanup options
    const success = smartCacheSet(cacheKey, JSON.stringify(cacheData), {
      maxRetries: 2,
      clearOldCaches: true,
      clearAllOnFinalFailure: true
    });
    
    if (!success) {
      console.warn('Failed to cache job details after multiple attempts');
    }
  };

  // Clear old job detail caches
  const clearOldJobDetailCaches = () => {
    try {
      const keys = Object.keys(localStorage);
      const jobDetailCacheKeys = keys.filter(key => key.startsWith(JOB_CACHE_KEY_PREFIX));
      const now = new Date().getTime();
      
      jobDetailCacheKeys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsedCache = JSON.parse(cached);
            // Remove caches older than 2 hours
            if (now - parsedCache.timestamp > 2 * 60 * 60 * 1000) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted cache
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing old job detail caches:', error);
    }
  };

  // Clear all job detail caches (more aggressive cleanup)
  const clearAllJobDetailCaches = () => {
    try {
      const keys = Object.keys(localStorage);
      const jobDetailCacheKeys = keys.filter(key => key.startsWith(JOB_CACHE_KEY_PREFIX));
      
      jobDetailCacheKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing cache key:', key, error);
        }
      });
      
      console.log(`Cleared ${jobDetailCacheKeys.length} job detail cache entries`);
    } catch (error) {
      console.error('Error clearing all job detail caches:', error);
    }
  };

  // Fetch job details from API with caching
  const fetchJobDetails = async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from cache first
      if (useCache) {
        const cachedJob = loadJobFromCache(jobId);
        if (cachedJob) {
          setJob(cachedJob);
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        }
      });

      const data = await response.json();

      if (data.success) {
        setJob(data.data.job);
        // Save to cache
        saveJobToCache(jobId, data.data.job);
      } else {
        setError(data.message || 'Failed to fetch job details');
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Force refresh without cache
  const refreshJobDetails = () => {
    fetchJobDetails(false);
  };

  // Check if job is saved
  const checkIfJobIsSaved = async () => {
    try {
      const response = await apiRequest('/api/applicant/saved-jobs', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Check if current job is in the saved jobs list
          const isCurrentJobSaved = data.data.some(job => job.id === jobId);
          setIsSaved(isCurrentJobSaved);
        }
      }
    } catch (error) {
      console.error('Error checking saved job status:', error);
    }
  };

  // Fetch job details on component mount
  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      checkIfJobIsSaved();
    }
  }, [jobId]);

  const handleApply = () => {
    navigate(`/jobs/${jobId}/apply`);
  };

  const handleSave = async () => {
    if (savingJob) return; // Prevent multiple simultaneous saves
    
    try {
      setSavingJob(true);
      
      if (isSaved) {
        // Unsave the job
        const response = await apiRequest(`/api/applicant/saved-jobs/${jobId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setIsSaved(false);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error unsaving job:', errorData.message);
        }
      } else {
        // Save the job
        const response = await apiRequest(`/api/applicant/saved-jobs/${jobId}`, {
          method: 'POST'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setIsSaved(true);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error saving job:', errorData.message);
        }
      }
    } catch (error) {
      console.error('Error toggling saved job:', error);
    } finally {
      setSavingJob(false);
    }
  };

  // Skeleton loading component
  const JobDetailsSkeleton = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </div>

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
      </div>

      {/* Content skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-8 transition-colors duration-300">
        {/* About section */}
        <div className="mb-8">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>

        {/* Responsibilities section */}
        <div className="mb-8">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Qualifications section */}
        <div className="mb-8">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="mt-8 flex space-x-4">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {loading ? (
        <JobDetailsSkeleton />
      ) : error ? (
        // Error state
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg p-12 text-center transition-colors duration-300">
            <div className="text-red-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white font-['Open_Sans'] mb-2">
              Job not found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] mb-4">
              {error}
            </p>
            <div className="space-x-4">
              <button
                onClick={refreshJobDetails}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                Try again
              </button>
              <Link
                to="/jobs"
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors inline-block"
              >
                Back to jobs
              </Link>
            </div>
          </div>
        </div>
      ) : job ? (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/jobs" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-['Roboto'] text-sm transition-colors duration-300">
                  Jobs
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 dark:text-white font-['Roboto'] text-sm font-medium transition-colors duration-300">
                  {job.title || 'Job Details'}
                </span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Job Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] mb-2">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-lg text-gray-600 dark:text-gray-300 font-['Roboto'] mb-6">
            <span>{job.company}</span>
            <span>•</span>
            <span>{job.location}</span>
            <span>•</span>
            <span>{job.workType}</span>
            <span>•</span>
            <span>{job.jobType}</span>
            {job.salary && job.salary !== 'Not disclosed' && (
              <>
                <span>•</span>
                <span>{job.salary}</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
            <span>Posted {job.postedDate}</span>
            {job.applicationDeadline && (
              <>
                <span>•</span>
                <span>Apply by {new Date(job.applicationDeadline).toLocaleDateString()}</span>
              </>
            )}
            {job.views && (
              <>
                <span>•</span>
                <span>{job.views} views</span>
              </>
            )}
          </div>
        </div>

        {/* Job Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-8 transition-colors duration-300">
          {/* About the job */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-4">
              About the job
            </h2>
            <div className="text-gray-700 dark:text-gray-300 font-['Roboto'] leading-relaxed text-base whitespace-pre-line">
              {job.description}
            </div>
            {job.department && (
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-300">
                  {job.department}
                </span>
              </div>
            )}
          </div>

          {/* Required Skills */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-4">
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    // Primary, high-contrast style for required skills
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black dark:bg-white text-white dark:text-black transition-colors duration-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Skills */}
          {job.preferredSkills && job.preferredSkills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-4">
                Preferred Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.preferredSkills.map((skill, index) => (
                  <span
                    key={index}
                    // Secondary style for preferred skills
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 transition-colors duration-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {job.qualification && job.qualification.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-4">
                Qualifications
              </h2>
              <ul className="space-y-3">
                {job.qualification.map((qualification, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-black dark:bg-white rounded-full mt-2.5 mr-4 transition-colors duration-300"></div>
                    <span className="text-gray-700 dark:text-gray-300 font-['Roboto'] text-base leading-relaxed">{qualification}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Company Details */}
          {job.companyDetails && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-4">
                About {job.company}
              </h2>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                {job.companyDetails.description && (
                  <p className="text-gray-700 dark:text-gray-300 font-['Roboto'] text-base leading-relaxed mb-4">
                    {job.companyDetails.description}
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {job.companyDetails.headquarters && (
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Location:</span>
                      <span className="text-gray-600 dark:text-gray-300 ml-2">{job.companyDetails.headquarters}</span>
                    </div>
                  )}
                  {job.companyDetails.website && (
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Website:</span>
                      <a
                        href={job.companyDetails.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-500 ml-2 underline"
                      >
                        {job.companyDetails.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Application Info */}
          <div className="mb-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-6 border border-indigo-200 dark:border-indigo-700 transition-colors duration-300">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] mb-4">
              Application Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {job.applicationsCount !== undefined && (
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Applications:</span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">{job.applicationsCount} submitted</span>
                </div>
              )}
              {job.maxApplicants && (
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Max Applicants:</span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">{job.maxApplicants}</span>
                </div>
              )}
              {job.experience && (
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Experience Level:</span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">{job.experience}</span>
                </div>
              )}
              {job.applicationDeadline && (
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Deadline:</span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">
                    {new Date(job.applicationDeadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={handleApply}
            disabled={job.hasApplied}
            className={`px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors duration-300 ${
              job.hasApplied
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
            }`}
          >
            {job.hasApplied ? 'Already Applied' : 'Apply Now'}
          </button>
          <button
            onClick={handleSave}
            disabled={savingJob}
            className={`border px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors disabled:opacity-50 duration-300 ${
              isSaved
                ? 'border-red-400 text-red-600 dark:border-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50'
                : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {savingJob ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-white mr-2"></div>
                {isSaved ? 'Removing...' : 'Saving...'}
              </div>
            ) : (
              <div className="flex items-center">
                <svg 
                  className={`w-4 h-4 mr-2 ${isSaved ? 'fill-current' : 'stroke-current'}`} 
                  fill={isSaved ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isSaved ? 'Saved' : 'Save'}
              </div>
            )}
          </button>
          <Link
            to="/jobs"
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors inline-flex items-center"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
      ) : null}
    </DashboardLayout>
  );
};

export default JobDetailsPage;
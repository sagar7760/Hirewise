import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { CACHE_PREFIXES, CACHE_DURATIONS } from '../../utils/cacheUtils';

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
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
    try {
      const cacheKey = JOB_CACHE_KEY_PREFIX + jobId;
      const cacheData = {
        timestamp: new Date().getTime(),
        data: jobData
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving job to cache:', error);
      // If localStorage is full, try to clear old job detail caches
      clearOldJobDetailCaches();
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

  // Fetch job details on component mount
  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const handleApply = () => {
    navigate(`/jobs/${jobId}/apply`);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    console.log(isSaved ? 'Unsaved job:' : 'Saved job:', jobId);
  };

  // Skeleton loading component
  const JobDetailsSkeleton = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="h-4 bg-gray-200 rounded w-12"></div>
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
      </div>

      {/* Content skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
        {/* About section */}
        <div className="mb-8">
          <div className="h-7 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>

        {/* Responsibilities section */}
        <div className="mb-8">
          <div className="h-7 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-gray-200 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Qualifications section */}
        <div className="mb-8">
          <div className="h-7 bg-gray-200 rounded w-36 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-gray-200 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits section */}
        <div>
          <div className="h-7 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-gray-200 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="mt-8 flex space-x-4">
        <div className="h-12 bg-gray-200 rounded w-32"></div>
        <div className="h-12 bg-gray-200 rounded w-24"></div>
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
          <div className="bg-white border border-red-200 rounded-lg p-12 text-center">
            <div className="text-red-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 font-['Open_Sans'] mb-2">
              Job not found
            </h3>
            <p className="text-gray-600 font-['Roboto'] mb-4">
              {error}
            </p>
            <div className="space-x-4">
              <button
                onClick={refreshJobDetails}
                className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                Try again
              </button>
              <Link
                to="/jobs"
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors inline-block"
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
                <Link to="/jobs" className="text-gray-500 hover:text-gray-700 font-['Roboto'] text-sm">
                  Jobs
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-['Roboto'] text-sm font-medium">
                  {job.title || 'Job Details'}
                </span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Job Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-lg text-gray-600 font-['Roboto'] mb-6">
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
          <div className="flex flex-wrap gap-2 text-sm text-gray-500 font-['Roboto']">
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
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          {/* About the job */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] mb-4">
              About the job
            </h2>
            <div className="text-gray-700 font-['Roboto'] leading-relaxed text-base whitespace-pre-line">
              {job.description}
            </div>
            {job.department && (
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {job.department}
                </span>
              </div>
            )}
          </div>

          {/* Required Skills */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] mb-4">
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black text-white"
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
              <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] mb-4">
                Preferred Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.preferredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
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
              <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] mb-4">
                Qualifications
              </h2>
              <ul className="space-y-3">
                {job.qualification.map((qualification, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-black rounded-full mt-2.5 mr-4"></div>
                    <span className="text-gray-700 font-['Roboto'] text-base leading-relaxed">{qualification}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Company Details */}
          {job.companyDetails && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] mb-4">
                About {job.company}
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                {job.companyDetails.description && (
                  <p className="text-gray-700 font-['Roboto'] text-base leading-relaxed mb-4">
                    {job.companyDetails.description}
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {job.companyDetails.headquarters && (
                    <div>
                      <span className="font-medium text-gray-900">Location:</span>
                      <span className="text-gray-600 ml-2">{job.companyDetails.headquarters}</span>
                    </div>
                  )}
                  {job.companyDetails.website && (
                    <div>
                      <span className="font-medium text-gray-900">Website:</span>
                      <a
                        href={job.companyDetails.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 ml-2 underline"
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
          <div className="mb-8 bg-blue-50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] mb-4">
              Application Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {job.applicationsCount !== undefined && (
                <div>
                  <span className="font-medium text-gray-900">Applications:</span>
                  <span className="text-gray-600 ml-2">{job.applicationsCount} submitted</span>
                </div>
              )}
              {job.maxApplicants && (
                <div>
                  <span className="font-medium text-gray-900">Max Applicants:</span>
                  <span className="text-gray-600 ml-2">{job.maxApplicants}</span>
                </div>
              )}
              {job.experience && (
                <div>
                  <span className="font-medium text-gray-900">Experience Level:</span>
                  <span className="text-gray-600 ml-2">{job.experience}</span>
                </div>
              )}
              {job.applicationDeadline && (
                <div>
                  <span className="font-medium text-gray-900">Deadline:</span>
                  <span className="text-gray-600 ml-2">
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
            className={`px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors ${
              job.hasApplied
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {job.hasApplied ? 'Already Applied' : 'Apply Now'}
          </button>
          <button
            onClick={handleSave}
            className={`border px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors ${
              isSaved
                ? 'border-black text-black bg-gray-50'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <Link
            to="/jobs"
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors inline-flex items-center"
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

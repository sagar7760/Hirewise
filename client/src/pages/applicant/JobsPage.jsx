import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { CACHE_PREFIXES, CACHE_DURATIONS } from '../../utils/cacheUtils';
import { smartCacheSet, clearExpiredCache } from '../../utils/cacheManager';

const JobsPage = () => {
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    workType: '', // Remote, Hybrid, On-site
    jobType: '', // Full-time, Part-time, Contract, Internship
    location: '',
    country: '',
    experience: '', // Entry, Mid, Senior
    salary: '', // Salary range
    company: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [savedJobs, setSavedJobs] = useState([]);
  const [savingJobId, setSavingJobId] = useState(null);

  // Cache management
  const CACHE_DURATION = CACHE_DURATIONS.JOBS;
  const CACHE_KEY_PREFIX = CACHE_PREFIXES.JOBS;

  // Generate cache key based on search parameters
  const getCacheKey = (searchTerm, filtersObj, page) => {
    const searchParams = {
      search: searchTerm,
      ...filtersObj,
      page: page
    };
    // Create a stable key by sorting the object
    const sortedParams = Object.keys(searchParams)
      .sort()
      .reduce((result, key) => {
        if (searchParams[key]) {
          result[key] = searchParams[key];
        }
        return result;
      }, {});
    
    try {
      // Use encodeURIComponent to handle special characters before base64
      const paramString = JSON.stringify(sortedParams);
      const cacheKey = CACHE_KEY_PREFIX + btoa(encodeURIComponent(paramString));
      return cacheKey;
    } catch (error) {
      console.error('Error generating cache key:', error);
      // Fallback to a simple hash-like key
      const fallbackKey = JSON.stringify(sortedParams).replace(/[^a-zA-Z0-9]/g, '_');
      const cacheKey = CACHE_KEY_PREFIX + fallbackKey;
      return cacheKey;
    }
  };

  // Load data from cache
  const loadFromCache = (cacheKey) => {
    try {
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = new Date().getTime();
        
        // Check if cache is still valid (check both old format and new format)
        const isValid = parsedCache.expiry 
          ? now < parsedCache.expiry 
          : (now - parsedCache.timestamp < CACHE_DURATION);
          
        if (isValid) {
          return parsedCache.data;
        } else {
          // Remove expired cache
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
      // Remove corrupted cache
      localStorage.removeItem(cacheKey);
    }
    return null;
  };

  // Save data to cache
  const saveToCache = (cacheKey, data) => {
    try {
      const cacheData = {
        timestamp: new Date().getTime(),
        expiry: new Date().getTime() + (5 * 60 * 1000), // 5 minutes
        data: data
      };
      
      const dataSize = JSON.stringify(cacheData).length;
      
      // Check if data is too large (localStorage limit is typically 5-10MB, but let's be conservative)
      if (dataSize > 1000000) { // 1MB limit
        console.warn('Jobs data too large for cache, skipping');
        return;
      }
      
      // Use smart cache setter
      const success = smartCacheSet(cacheKey, JSON.stringify(cacheData), {
        maxRetries: 2,
        clearOldCaches: true,
        clearAllOnFinalFailure: false
      });
      
      if (!success) {
        // Try with minimal data structure as fallback
        const minimalData = {
          timestamp: new Date().getTime(),
          expiry: new Date().getTime() + (5 * 60 * 1000),
          data: {
            jobs: data.jobs ? data.jobs.slice(0, 5) : [], // Only first 5 jobs
            pagination: data.pagination
          }
        };
        
        smartCacheSet(cacheKey, JSON.stringify(minimalData), {
          maxRetries: 1,
          clearOldCaches: true,
          clearAllOnFinalFailure: false
        });
      }
    } catch (error) {
      console.error('Error in saveToCache:', error);
    }
  };

  // Clear old job caches to free up space
  const clearOldJobCaches = () => {
    try {
      const keys = Object.keys(localStorage);
      const jobCacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX) || key.startsWith('hirewise_job'));
      const now = new Date().getTime();
      
      let clearedCount = 0;
      jobCacheKeys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsedCache = JSON.parse(cached);
            // Remove caches older than 10 minutes (more aggressive)
            const isOld = parsedCache.expiry 
              ? now > parsedCache.expiry 
              : (now - parsedCache.timestamp > 10 * 60 * 1000);
              
            if (isOld) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          }
        } catch (error) {
          // Remove corrupted cache
          localStorage.removeItem(key);
          clearedCount++;
        }
      });
      
      // If we still have too many cache entries, clear more aggressively
      const remainingKeys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
      if (remainingKeys.length > 5) {
        // Sort by timestamp and keep only the 3 newest
        const cacheEntries = [];
        remainingKeys.forEach(key => {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const parsedCache = JSON.parse(cached);
              cacheEntries.push({
                key,
                timestamp: parsedCache.timestamp || 0
              });
            }
          } catch (error) {
            localStorage.removeItem(key);
          }
        });
        
        // Sort by timestamp (newest first) and keep only 3
        cacheEntries.sort((a, b) => b.timestamp - a.timestamp);
        const toRemove = cacheEntries.slice(3);
        
        toRemove.forEach(entry => {
          localStorage.removeItem(entry.key);
          clearedCount++;
        });
      }
    } catch (error) {
      console.error('Error clearing old caches:', error);
    }
  };

  // Fetch jobs from API with caching
  const fetchJobs = useCallback(async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = getCacheKey(debouncedSearchTerm, filters, currentPage);
      
      // Try to load from cache first
      if (useCache) {
        const cachedData = loadFromCache(cacheKey);
        if (cachedData) {
          setJobs(cachedData.jobs);
          setPagination(cachedData.pagination);
          setLoading(false);
          return;
        }
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      // Add search term
      if (debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim());
      }

      // Add filters
      if (filters.workType) {
        // Convert frontend values to backend values
        const workTypeMap = {
          'Remote': 'remote',
          'Hybrid': 'hybrid',
          'On-site': 'onsite'
        };
        params.append('workType', workTypeMap[filters.workType] || filters.workType.toLowerCase());
      }

      if (filters.jobType) params.append('jobType', filters.jobType);
      if (filters.experience) params.append('experienceLevel', filters.experience);
      if (filters.location) params.append('location', filters.location);
      if (filters.country) params.append('country', filters.country);
      if (filters.company) params.append('company', filters.company);

      const response = await fetch(`/api/jobs?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        }
      });

      const data = await response.json();

      if (data.success) {
        const responseData = {
          jobs: data.data.jobs,
          pagination: data.data.pagination
        };
        
        setJobs(responseData.jobs);
        setPagination(responseData.pagination);
        
        // Create a lightweight version for caching (only essential fields)
        const lightweightData = {
          jobs: data.data.jobs.map(job => ({
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            workType: job.workType,
            jobType: job.jobType,
            experience: job.experience,
            salary: job.salary,
            postedDate: job.postedDate,
            // Skip any large fields like descriptions, requirements, etc.
          })),
          pagination: data.data.pagination
        };
        
        // Save lightweight version to cache
        saveToCache(cacheKey, lightweightData);
      } else {
        setError(data.message || 'Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filters, currentPage]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when search or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, filters]);

  // Fetch jobs when dependencies change
  useEffect(() => {
    fetchJobs();
  }, [debouncedSearchTerm, filters, currentPage, fetchJobs]);

  // Load saved jobs on component mount
  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        const response = await apiRequest('/api/applicant/saved-jobs', {
          method: 'GET'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Extract just the job IDs from the saved jobs data
            const savedJobIds = data.data.map(job => job.id);
            setSavedJobs(savedJobIds);
          }
        }
      } catch (error) {
        console.error('Error loading saved jobs:', error);
      }
    };

    loadSavedJobs();
  }, [apiRequest]);

  const totalJobs = pagination.totalJobs;
  const totalPages = pagination.totalPages;

  // Filter the jobs based on current filters (keeping for local filtering if needed)
  const filteredJobs = jobs;

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleApply = (e, jobId) => {
    e.stopPropagation();
    navigate(`/jobs/${jobId}/apply`);
  };

  const handleSaveJob = async (e, jobId) => {
    e.stopPropagation();
    
    try {
      setSavingJobId(jobId);
      
      const response = await apiRequest(`/api/applicant/saved-jobs/${jobId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Add to saved jobs list
          setSavedJobs(prev => [...prev, jobId]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error saving job:', errorData.message);
      }
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setSavingJobId(null);
    }
  };

  const handleUnsaveJob = async (e, jobId) => {
    e.stopPropagation();
    
    try {
      setSavingJobId(jobId);
      
      const response = await apiRequest(`/api/applicant/saved-jobs/${jobId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Remove from saved jobs list
          setSavedJobs(prev => prev.filter(id => id !== jobId));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error unsaving job:', errorData.message);
      }
    } catch (error) {
      console.error('Error unsaving job:', error);
    } finally {
      setSavingJobId(null);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // The useEffect will handle the API call
  };

  const handleSingleSelectFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    // The useEffect will handle the API call
  };

  const clearAllFilters = () => {
    setFilters({
      workType: '',
      jobType: '',
      location: '',
      country: '',
      experience: '',
      salary: '',
      company: ''
    });
    setSearchTerm('');
    // The useEffect will handle the API call
  };

  // Force refresh without cache
  const refreshJobs = useCallback(() => {
    fetchJobs(false);
  }, [fetchJobs]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.workType) count++;
    if (filters.jobType) count++;
    if (filters.location) count++;
    if (filters.country) count++;
    if (filters.experience) count++;
    if (filters.company) count++;
    return count;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // The useEffect will handle the API call
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-6">
            Jobs you might like
          </h1>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search jobs"
                value={searchTerm}
                onChange={handleSearch}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-['Roboto'] transition-colors"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
              {/* Work Type Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 font-['Roboto'] mb-1">
                  Work Type
                </label>
                <select
                  value={filters.workType}
                  onChange={(e) => handleSingleSelectFilter('workType', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white"
                >
                  <option value="">Any Work Type</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              {/* Job Type Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 font-['Roboto'] mb-1">
                  Job Type
                </label>
                <select
                  value={filters.jobType}
                  onChange={(e) => handleSingleSelectFilter('jobType', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white"
                >
                  <option value="">Any Job Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              {/* Experience Level Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 font-['Roboto'] mb-1">
                  Experience Level
                </label>
                <select
                  value={filters.experience}
                  onChange={(e) => handleSingleSelectFilter('experience', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white"
                >
                  <option value="">Any Experience</option>
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                </select>
              </div>


              {/* Country Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 font-['Roboto'] mb-1">
                  Country
                </label>
                <select
                  value={filters.country}
                  onChange={(e) => handleSingleSelectFilter('country', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white"
                >
                  <option value="">All Countries</option>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
                  {/* Location Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 font-['Roboto'] mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter city or state"
                  value={filters.location}
                  onChange={(e) => handleSingleSelectFilter('location', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white placeholder-gray-400"
                />
              </div>

              {/* Company Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 font-['Roboto'] mb-1">
                  Company
                </label>
                <input
                  type="text"
                  placeholder="Company name"
                  value={filters.company}
                  onChange={(e) => handleSingleSelectFilter('company', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-['Roboto'] bg-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getActiveFilterCount() > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 font-['Roboto'] underline"
                  >
                    Clear all filters ({getActiveFilterCount()})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Job Count */}
          <div className="mb-6">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
            ) : error ? (
              <p className="text-lg font-semibold text-red-600 font-['Open_Sans']">
                Error loading jobs
              </p>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-gray-900 font-['Open_Sans']">
                  {totalJobs.toLocaleString()} jobs
                  {totalJobs > 10 && (
                    <span className="text-gray-500 text-base font-normal">
                      {' '}(showing page {pagination.currentPage} of {totalPages})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4 mb-8">
          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
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
          ) : error ? (
            // Error state
            <div className="bg-white border border-red-200 rounded-lg p-12 text-center">
              <div className="text-red-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 font-['Open_Sans'] mb-2">
                Failed to load jobs
              </h3>
              <p className="text-gray-600 font-['Roboto'] mb-4">
                {error}
              </p>
              <button
                onClick={refreshJobs}
                className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                Try again
              </button>
            </div>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job.id)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
                      {job.title}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 font-['Roboto']">
                        Posted {job.postedDate}
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
                      onClick={(e) => savedJobs.includes(job.id) ? handleUnsaveJob(e, job.id) : handleSaveJob(e, job.id)}
                      disabled={savingJobId === job.id}
                      className={`px-3 py-2 rounded-lg font-medium font-['Roboto'] transition-colors ${
                        savedJobs.includes(job.id)
                          ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      } disabled:opacity-50`}
                      title={savedJobs.includes(job.id) ? 'Remove from saved' : 'Save job'}
                    >
                      {savingJobId === job.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      ) : (
                        <svg 
                          className={`w-4 h-4 ${savedJobs.includes(job.id) ? 'fill-current' : 'stroke-current'}`} 
                          fill={savedJobs.includes(job.id) ? 'currentColor' : 'none'} 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={(e) => handleApply(e, job.id)}
                      className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 font-['Open_Sans'] mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600 font-['Roboto'] mb-4">
                Try adjusting your search criteria or filters to find more jobs.
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className={`p-2 rounded-md transition-colors ${
                !pagination.hasPrevPage
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page Numbers */}
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              // Show first page, last page, current page, and pages around current page
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors font-['Roboto'] ${
                      currentPage === page
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 3 ||
                page === currentPage + 3
              ) {
                return (
                  <span key={page} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className={`p-2 rounded-md transition-colors ${
                !pagination.hasNextPage
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div> HireWise- A </div>
    </DashboardLayout>
  );
};

export default JobsPage;

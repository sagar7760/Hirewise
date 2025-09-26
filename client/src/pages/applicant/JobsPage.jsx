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
      console.log(`💾 Cache data size: ${(dataSize / 1024).toFixed(2)}KB`);
      
      // Check if data is too large (localStorage limit is typically 5-10MB, but let's be conservative)
      if (dataSize > 2000000) { // 2MB limit (increased to accommodate logos)
        console.warn('Jobs data too large for cache, creating minimal version');
        // Create minimal version without logos if too large
        const minimalData = {
          ...cacheData,
          data: {
            ...data,
            jobs: data.jobs.map(job => ({
              ...job,
              companyLogo: job.companyLogo ? 'LOGO_PLACEHOLDER' : null // Placeholder for large logos
            }))
          }
        };
        const success = smartCacheSet(cacheKey, JSON.stringify(minimalData), {
          maxRetries: 1,
          clearOldCaches: true,
          clearAllOnFinalFailure: false
        });
        if (success) console.log('💾 Saved minimal cache version');
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
          console.log('📦 Loading jobs from cache');
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
        
        // Debug: Check if logos are present in API response
        const firstJob = data.data.jobs[0];
        console.log('🔍 API Response check:', {
          hasJobs: data.data.jobs.length > 0,
          firstJobHasLogo: !!firstJob?.companyLogo,
          logoSize: firstJob?.companyLogo ? `${(firstJob.companyLogo.length / 1024).toFixed(1)}KB` : 'No logo'
        });
        
        setJobs(responseData.jobs);
        setPagination(responseData.pagination);
        
        // Create cache data with logo information included
        const cacheData = {
          jobs: data.data.jobs.map(job => ({
            id: job.id,
            title: job.title,
            company: job.company,
            companyLogo: job.companyLogo, // Include full logo data
            location: job.location,
            workType: job.workType,
            jobType: job.jobType,
            experience: job.experience,
            salary: job.salary,
            postedDate: job.postedDate,
            country: job.country,
            // Include all essential fields for job display
          })),
          pagination: data.data.pagination
        };
        
        // Save to cache with logo data
        console.log('💾 Saving jobs to cache with logo data');
        saveToCache(cacheKey, cacheData);
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

  const renderPaginationButton = (page, isCurrent) => (
    <button
      key={page}
      onClick={() => handlePageChange(page)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors font-['Roboto'] ${
        isCurrent
          ? 'bg-black text-white dark:bg-white dark:text-black'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {page}
    </button>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] mb-6">
            Jobs you might like
          </h1>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search jobs"
                value={searchTerm}
                onChange={handleSearch}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
              {/* Filter components */}
              {Object.keys(filters).map((filterType) => {
                let options = [];
                let label = '';
                let placeholder = '';

                switch (filterType) {
                  case 'workType':
                    label = 'Work Type';
                    options = ['Remote', 'Hybrid', 'On-site'];
                    break;
                  case 'jobType':
                    label = 'Job Type';
                    options = ['Full-time', 'Part-time', 'Contract', 'Internship'];
                    break;
                  case 'experience':
                    label = 'Experience Level';
                    options = ['Entry', 'Mid', 'Senior'];
                    break;
                  case 'country':
                    label = 'Country';
                    options = ['India', 'United States', 'Canada', 'United Kingdom', 'Germany', 'Australia'];
                    break;
                  case 'location':
                    label = 'Location';
                    placeholder = 'Enter city or state';
                    break;
                  case 'company':
                    label = 'Company';
                    placeholder = 'Company name';
                    break;
                  case 'salary':
                    // Salary filter is complex, can be simplified to a direct input or left out for now
                    return null;
                  default:
                    return null;
                }

                return (
                  <div key={filterType} className="relative">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 font-['Roboto'] mb-1">
                      {label}
                    </label>
                    {options.length > 0 ? (
                      <select
                        value={filters[filterType]}
                        onChange={(e) => handleSingleSelectFilter(filterType, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] transition-colors"
                      >
                        <option value="">Any {label}</option>
                        {options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={placeholder}
                        value={filters[filterType]}
                        onChange={(e) => handleSingleSelectFilter(filterType, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white font-['Roboto'] placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getActiveFilterCount() > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-['Roboto'] underline transition-colors"
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
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            ) : error ? (
              <p className="text-lg font-semibold text-red-600 dark:text-red-400 font-['Open_Sans']">
                Error loading jobs
              </p>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans']">
                  {totalJobs.toLocaleString()} jobs
                  {totalJobs > 10 && (
                    <span className="text-gray-500 dark:text-gray-400 text-base font-normal">
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
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg p-12 text-center transition-colors duration-300">
              <div className="text-red-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white font-['Open_Sans'] mb-2">
                Failed to load jobs
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] mb-4">
                {error}
              </p>
              <button
                onClick={refreshJobs}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
              >
                Try again
              </button>
            </div>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => {
              // Minimal debug: Only log if there's an issue
              if (!job.companyLogo && !job.company?.logo) {
                console.log(`⚠️ No logo data for ${job.title}`);
              }
              
              return (
              <div
                key={job.id}
                onClick={() => handleJobClick(job.id)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg dark:hover:shadow-white/10 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start space-x-4">
                  {/* Company Logo */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden relative transition-colors duration-300">
                      {/* Company Logo Image */}
                      {(() => {
                        const hasLogo = job.companyLogo || (job.company && job.company.logo);
                        const logoSrc = job.companyLogo || job.company?.logo;
                        
                        return hasLogo ? (
                          <img 
                            src={logoSrc} 
                            alt={`${(typeof job.company === 'string' ? job.company : job.company?.name) || 'Company'} logo`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              console.log(`❌ Logo failed to load for ${job.title}`);
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement.querySelector('.logo-fallback');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null;
                      })()}
                      {/* Fallback Letter */}
                      <div className={`logo-fallback w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-sm ${(job.companyLogo || (job.company && job.company.logo)) ? 'hidden' : 'flex'}`}>
                        {((typeof job.company === 'string' ? job.company : job.company?.name) || 'Company').charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Job Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                          {job.title}
                        </h3>
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-300 font-['Roboto'] mb-3">
                          {typeof job.company === 'string' ? job.company : job.company?.name || 'Company'}
                        </p>
                        
                        {/* Job Details with Icons */}
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm font-['Roboto']">{job.location}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                            </svg>
                            <span className="text-sm font-['Roboto']">{job.workType}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-['Roboto']">{job.jobType}</span>
                          </div>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            {job.experience} Level
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            {job.salary}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            Posted {job.postedDate}
                          </span>
                        </div>
                      </div>
                      
                      {/* Apply Button */}
                      <div className="flex-shrink-0 ml-4">
                        <button
                          onClick={(e) => handleApply(e, job.id)}
                          className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-2.5 rounded-lg font-medium font-['Roboto'] transition-colors duration-200"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center transition-colors duration-300">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white font-['Open_Sans'] mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] mb-4">
                Try adjusting your search criteria or filters to find more jobs.
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2 rounded-lg font-medium font-['Roboto'] transition-colors"
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
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
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
                return renderPaginationButton(page, currentPage === page);
              } else if (
                page === currentPage - 3 ||
                page === currentPage + 3
              ) {
                return (
                  <span key={page} className="px-2 text-gray-400 dark:text-gray-600">
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
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
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
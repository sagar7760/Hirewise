import { useState, useEffect, useCallback } from 'react';
import { useApiRequest } from './useApiRequest';

// Custom hook for managing HR applications with caching
export const useHRApplications = () => {
  const { makeJsonRequest } = useApiRequest();
  
  // State management
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalApplications: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 20
  });
  
  // Cache management
  const [cache, setCache] = useState(new Map());
  const [lastFetchParams, setLastFetchParams] = useState(null);

  // Generate cache key from parameters
  const generateCacheKey = useCallback((params) => {
    return JSON.stringify({
      page: params.page || 1,
      limit: params.limit || 20,
      job: params.job || 'all',
      status: params.status || 'all',
      search: params.search || '',
      sortBy: params.sortBy || 'appliedDate',
      sortOrder: params.sortOrder || 'desc'
    });
  }, []);

  // Fetch applications with caching
  const fetchApplications = useCallback(async (params = {}) => {
    try {
      const cacheKey = generateCacheKey(params);
      
      // Check cache first
      if (cache.has(cacheKey) && JSON.stringify(params) === JSON.stringify(lastFetchParams)) {
        const cachedData = cache.get(cacheKey);
        setApplications(cachedData.applications);
        setPagination(cachedData.pagination);
        setError(null);
        setLoading(false);
        return cachedData;
      }

      setLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.job && params.job !== 'all') queryParams.append('job', params.job);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await makeJsonRequest(`/api/hr/applications?${queryParams}`);
      
      if (response.success) {
        const responseData = {
          applications: response.data,
          pagination: response.pagination
        };

        // Update cache
        setCache(prev => new Map(prev.set(cacheKey, responseData)));
        setLastFetchParams(params);
        
        setApplications(response.data);
        setPagination(response.pagination);
        setError(null);
        
        return responseData;
      } else {
        throw new Error(response.message || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.message || 'Failed to fetch applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [makeJsonRequest, generateCacheKey, cache, lastFetchParams]);

  // Update application status
  const updateApplicationStatus = useCallback(async (applicationId, newStatus) => {
    try {
      const response = await makeJsonRequest(`/api/hr/applications/${applicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.success) {
        // Update local state
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, status: newStatus }
              : app
          )
        );

        // Clear cache to ensure fresh data on next fetch
        setCache(new Map());
        
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update application status' 
      };
    }
  }, [makeJsonRequest]);

  // Clear cache (useful for force refresh)
  const clearCache = useCallback(() => {
    setCache(new Map());
    setLastFetchParams(null);
  }, []);

  // Invalidate cache when component unmounts or when needed
  const invalidateCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    // Data
    applications,
    pagination,
    loading,
    error,
    
    // Actions
    fetchApplications,
    updateApplicationStatus,
    clearCache,
    invalidateCache,
    
    // Cache info
    isCached: cache.size > 0
  };
};
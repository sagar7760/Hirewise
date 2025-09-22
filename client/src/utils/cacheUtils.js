// Cache utility functions for managing job-related caches

const CACHE_PREFIXES = {
  JOBS: 'hirewise_jobs_',
  JOB_DETAILS: 'hirewise_job_details_',
  PROFILE: 'hirewise_profile_'
};

const CACHE_DURATIONS = {
  JOBS: 5 * 60 * 1000, // 5 minutes
  JOB_DETAILS: 10 * 60 * 1000, // 10 minutes
  PROFILE: 15 * 60 * 1000 // 15 minutes
};

// Clear all job-related caches
export const clearAllJobCaches = () => {
  try {
    const keys = Object.keys(localStorage);
    const jobKeys = keys.filter(key => 
      key.startsWith(CACHE_PREFIXES.JOBS) || 
      key.startsWith(CACHE_PREFIXES.JOB_DETAILS)
    );
    
    jobKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Cleared ${jobKeys.length} job cache entries`);
  } catch (error) {
    console.error('Error clearing job caches:', error);
  }
};

// Clear specific job detail cache
export const clearJobDetailCache = (jobId) => {
  try {
    const cacheKey = CACHE_PREFIXES.JOB_DETAILS + jobId;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing job detail cache:', error);
  }
};

// Invalidate job caches when job data might have changed
export const invalidateJobCaches = (jobId = null) => {
  try {
    if (jobId) {
      // Clear specific job detail cache
      clearJobDetailCache(jobId);
      
      // Clear all job list caches as they might contain outdated application counts
      const keys = Object.keys(localStorage);
      const jobListKeys = keys.filter(key => key.startsWith(CACHE_PREFIXES.JOBS));
      jobListKeys.forEach(key => localStorage.removeItem(key));
      
      console.log(`Invalidated caches for job ${jobId}`);
    } else {
      // Clear all job-related caches
      clearAllJobCaches();
    }
  } catch (error) {
    console.error('Error invalidating job caches:', error);
  }
};

// Clear expired caches across all types
export const clearExpiredCaches = () => {
  try {
    const keys = Object.keys(localStorage);
    const now = new Date().getTime();
    let clearedCount = 0;
    
    keys.forEach(key => {
      if (key.startsWith('hirewise_')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsedCache = JSON.parse(cached);
            
            // Determine cache duration based on key prefix
            let duration = 60 * 60 * 1000; // Default 1 hour
            if (key.startsWith(CACHE_PREFIXES.JOBS)) {
              duration = CACHE_DURATIONS.JOBS * 2; // Double the normal duration for cleanup
            } else if (key.startsWith(CACHE_PREFIXES.JOB_DETAILS)) {
              duration = CACHE_DURATIONS.JOB_DETAILS * 2;
            } else if (key.startsWith(CACHE_PREFIXES.PROFILE)) {
              duration = CACHE_DURATIONS.PROFILE * 2;
            }
            
            if (now - parsedCache.timestamp > duration) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          }
        } catch (error) {
          // Remove corrupted cache
          localStorage.removeItem(key);
          clearedCount++;
        }
      }
    });
    
    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} expired cache entries`);
    }
  } catch (error) {
    console.error('Error clearing expired caches:', error);
  }
};

// Get cache statistics
export const getCacheStats = () => {
  try {
    const keys = Object.keys(localStorage);
    const stats = {
      total: keys.length,
      jobs: keys.filter(key => key.startsWith(CACHE_PREFIXES.JOBS)).length,
      jobDetails: keys.filter(key => key.startsWith(CACHE_PREFIXES.JOB_DETAILS)).length,
      profile: keys.filter(key => key.startsWith(CACHE_PREFIXES.PROFILE)).length,
      other: keys.filter(key => key.startsWith('hirewise_') && 
        !key.startsWith(CACHE_PREFIXES.JOBS) && 
        !key.startsWith(CACHE_PREFIXES.JOB_DETAILS) && 
        !key.startsWith(CACHE_PREFIXES.PROFILE)).length
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
};

// Initialize cache cleanup on app start
export const initCacheCleanup = () => {
  // Clear expired caches on app start
  clearExpiredCaches();
  
  // Set up periodic cleanup (every 10 minutes)
  setInterval(clearExpiredCaches, 10 * 60 * 1000);
};

export { CACHE_PREFIXES, CACHE_DURATIONS };
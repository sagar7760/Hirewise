// Cache management utilities

/**
 * Get localStorage usage information
 */
export const getStorageInfo = () => {
  let used = 0;
  let total = 0;
  
  try {
    // Estimate localStorage usage
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    // Most browsers have 5-10MB localStorage limit
    // We'll assume 5MB as conservative estimate
    total = 5 * 1024 * 1024; // 5MB in bytes
    
    return {
      used,
      total,
      available: total - used,
      percentUsed: (used / total) * 100
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { used: 0, total: 0, available: 0, percentUsed: 0 };
  }
};

/**
 * Clear all HireWise related cache entries
 */
export const clearAllHireWiseCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const hireWiseKeys = keys.filter(key => 
      key.startsWith('hirewise_') || 
      key.startsWith('HIREWISE_') ||
      key.includes('hirewise')
    );
    
    let clearedCount = 0;
    hireWiseKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        clearedCount++;
      } catch (error) {
        console.error('Error removing cache key:', key, error);
      }
    });
    
    console.log(`Cleared ${clearedCount} HireWise cache entries`);
    return clearedCount;
  } catch (error) {
    console.error('Error clearing HireWise cache:', error);
    return 0;
  }
};

/**
 * Smart cache setter that handles quota exceeded errors
 */
export const smartCacheSet = (key, value, options = {}) => {
  const { 
    maxRetries = 2, 
    clearOldCaches = true,
    clearAllOnFinalFailure = false 
  } = options;
  
  const trySet = (retryCount = 0) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError' && retryCount < maxRetries) {
        console.warn(`Cache quota exceeded, attempt ${retryCount + 1}/${maxRetries + 1}`);
        
        if (clearOldCaches) {
          // Clear old entries first
          clearExpiredCache();
          
          // If still failing and we have more retries, clear more aggressively
          if (retryCount === maxRetries - 1 && clearAllOnFinalFailure) {
            clearAllHireWiseCache();
          }
          
          return trySet(retryCount + 1);
        }
      }
      
      console.warn('Unable to cache data:', error.message);
      return false;
    }
  };
  
  return trySet();
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('hirewise_'));
    const now = new Date().getTime();
    
    let clearedCount = 0;
    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          
          // Check if cache has expiry field
          if (parsedCache.expiry && now > parsedCache.expiry) {
            localStorage.removeItem(key);
            clearedCount++;
          }
          // Fallback to timestamp-based expiry (older than 1 hour)
          else if (parsedCache.timestamp && (now - parsedCache.timestamp) > 60 * 60 * 1000) {
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
    
    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} expired cache entries`);
    }
    
    return clearedCount;
  } catch (error) {
    console.error('Error clearing expired cache:', error);
    return 0;
  }
};

/**
 * Check if localStorage is available and working
 */
export const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};
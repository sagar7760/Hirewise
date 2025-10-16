/**
 * API utility functions for making requests to the backend
 * Handles environment-specific API URLs
 */

/**
 * Get the base API URL based on environment
 * In production (Vercel), uses VITE_API_URL
 * In development, uses proxy (empty string)
 */
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || '';
};

/**
 * Build full API endpoint URL
 * @param {string} endpoint - API endpoint path (e.g., '/api/auth/login')
 * @returns {string} Full URL to the API endpoint
 */
export const buildApiUrl = (endpoint) => {
  const apiUrl = getApiUrl();
  // Remove leading slash if apiUrl is present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return apiUrl ? `${apiUrl}${cleanEndpoint}` : cleanEndpoint;
};

/**
 * Make an API request with automatic URL handling
 * @param {string} endpoint - API endpoint path
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  return fetch(url, options);
};

export default {
  getApiUrl,
  buildApiUrl,
  apiRequest
};

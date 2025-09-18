import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useApiRequest = () => {
  const navigate = useNavigate();
  const { apiRequest } = useAuth();

  const makeRequest = useCallback(async (url, options = {}) => {
    try {
      const response = await apiRequest(url, options);
      return response;
    } catch (error) {
      // Handle authentication errors by navigating to login
      if (error.message === 'Authentication required') {
        console.log('Authentication required, redirecting to login...');
        navigate('/login');
        throw error; // Re-throw so calling code knows about the auth failure
      }
      
      // Re-throw other errors for the calling component to handle
      throw error;
    }
  }, [apiRequest, navigate]);

  // Helper method to make JSON API requests and parse responses
  const makeJsonRequest = useCallback(async (url, options = {}) => {
    const response = await makeRequest(url, options);
    
    // Check if response is successful
    if (response && response.ok) {
      return await response.json();
    }
    
    // Handle error responses
    if (response && !response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        // If can't parse JSON, create a generic error
        errorData = { 
          success: false, 
          error: 'Server Error', 
          message: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
      
      // Create an error object with the response data
      const error = new Error(errorData.message || errorData.error || 'Request failed');
      error.response = { data: errorData, status: response.status };
      throw error;
    }
    
    return null;
  }, [makeRequest]);

  return { makeRequest, makeJsonRequest };
};
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
    
    // Only try to parse JSON if we have a response
    if (response) {
      return await response.json();
    }
    
    return null;
  }, [makeRequest]);

  return { makeRequest, makeJsonRequest };
};
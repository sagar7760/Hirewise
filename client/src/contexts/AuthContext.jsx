import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for stored auth data on component mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // Refresh user data to get latest profile information including resume
        refreshUserData(storedToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const refreshUserData = async (authToken) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Process the data to make sure it's structured consistently and preserve ALL data
          const processedUserData = {
            ...data.data,
            // Explicitly preserve the profile object
            profile: data.data.profile,
            // Add resume fields to root level for easier access
            resume: data.data.resume || data.data.profile?.resume,
            currentResumeId: data.data.currentResumeId || data.data.profile?.currentResumeId,
            resumeAvailable: data.data.resumeAvailable,
            skills: data.data.profile?.primarySkills || data.data.skills
          };
          
          setUser(processedUserData);
          localStorage.setItem('user', JSON.stringify(processedUserData));
        }
      }
    } catch (error) {
      console.error('Error refreshing user data on startup:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data.user; // Return user for navigation purposes
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.message) {
        throw error;
      }
      throw new Error('Network error. Please try again.');
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = (updatedUser) => {
    console.log("updateUser - Setting user to:", updatedUser);
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    try {
      if (!token) return;
      
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Process the data to make sure it's structured consistently and preserve ALL data
          const updatedUser = {
            ...user, // Keep existing user data
            ...data.data, // Include all new data from API
            // Explicitly preserve the profile object
            profile: data.data.profile,
            // Add resume fields to root level for easier access
            resume: data.data.resume || data.data.profile?.resume, 
            currentResumeId: data.data.currentResumeId || data.data.profile?.currentResumeId,
            resumeAvailable: data.data.resumeAvailable,
            skills: data.data.profile?.primarySkills || data.data.skills
          };
          
          updateUser(updatedUser);
          return updatedUser;
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return false;
  };

  const isCompanyAdmin = () => {
    return user?.isCompanyAdmin || false;
  };

  const getCompany = () => {
    return user?.company || null;
  };

  // Function to make authenticated API requests
  const apiRequest = useCallback(async (url, options = {}) => {
    const config = {
      ...options,
      headers: {
        // Only set Content-Type for non-FormData requests
        ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);

      // Handle token expiration
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required');
      }

      // Handle request header too large
      if (response.status === 431) {
        console.error('Request headers too large. Clearing auth data...');
        logout();
        throw new Error('Session data corrupted. Please login again.');
      }

      return response;
    } catch (error) {
      // Handle network errors that might include header size issues
      if (error.message.includes('431') || error.message.includes('header')) {
        console.error('Header size error detected. Clearing auth data...');
        logout();
        throw new Error('Session data corrupted. Please login again.');
      }
      throw error;
    }
  }, [token, logout]); // Include logout in dependencies

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated,
    hasRole,
    isCompanyAdmin,
    getCompany,
    apiRequest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
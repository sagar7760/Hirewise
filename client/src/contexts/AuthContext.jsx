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
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [avatarHydrating, setAvatarHydrating] = useState(false);

  const hydrateAvatarIfNeeded = useCallback(async (candidateUser) => {
    try {
      if (!candidateUser || avatarHydrating) return;
      const avatarVal = candidateUser.avatar || candidateUser.profilePicture;
      if (avatarVal === 'base64_stored' && token) {
        setAvatarHydrating(true);
        const resp = await fetch('/api/admin/profile/avatar', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (resp.ok) {
          const data = await resp.json();
            if (data?.success && data.avatar && data.avatar.startsWith('data:image/')) {
              const hydrated = { ...candidateUser, avatar: data.avatar, profilePicture: data.avatar };
              setUser(hydrated);
              localStorage.setItem('user', JSON.stringify(hydrated));
            }
        }
      }
    } catch (e) {
      console.warn('Avatar hydration failed:', e.message);
    } finally {
      setAvatarHydrating(false);
    }
  }, [token, avatarHydrating]);

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
        // Only refresh if user data seems incomplete or is missing key fields
        const needsRefresh = !parsedUser.phone || 
                           !parsedUser.skills || 
                           !parsedUser.profile?.primarySkills || 
                           (!parsedUser.currentResumeId && !parsedUser.resumeAvailable);
        
        if (needsRefresh) {
          console.log('🔄 AuthContext: User data incomplete, refreshing...', {
            hasPhone: !!parsedUser.phone,
            hasSkills: !!parsedUser.skills,
            hasPrimarySkills: !!parsedUser.profile?.primarySkills,
            hasResume: !!(parsedUser.currentResumeId || parsedUser.resumeAvailable)
          });
          // Reset the refresh timer when we detect incomplete data
          setLastRefreshTime(0);
          refreshUserData(storedToken);
        } else {
          console.log('✅ AuthContext: User data looks complete, skipping refresh');
        }

        // Attempt avatar hydration if placeholder present
        hydrateAvatarIfNeeded(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const refreshUserData = async (authToken) => {
    // Rate limiting: don't refresh more than once every 10 seconds
    const now = Date.now();
    const REFRESH_COOLDOWN = 10 * 1000; // 10 seconds
    
    if (isRefreshingUser) {
      console.log('User data refresh already in progress, skipping...');
      return;
    }
    
    if (now - lastRefreshTime < REFRESH_COOLDOWN) {
      console.log('User data refreshed recently, skipping...');
      return;
    }

    try {
      setIsRefreshingUser(true);
      setLastRefreshTime(now);
      
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
    } finally {
      setIsRefreshingUser(false);
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
        // Preserve code and data for special error handling
        const error = new Error(data.message || 'Login failed');
        error.code = data.code;
        error.email = data.data?.email;
        throw error;
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
    // Trigger hydration if avatar is placeholder
    hydrateAvatarIfNeeded(updatedUser);
  };

  const refreshUser = async (forceRefresh = false) => {
    try {
      if (!token) return;
      
      // Rate limiting: don't refresh more than once every 10 seconds (unless forced)
      const now = Date.now();
      const REFRESH_COOLDOWN = 10 * 1000; // 10 seconds
      
      if (isRefreshingUser) {
        console.log('User data refresh already in progress, skipping...');
        return;
      }
      
      if (!forceRefresh && now - lastRefreshTime < REFRESH_COOLDOWN) {
        console.log('User data refreshed recently, skipping...');
        return;
      }

      setIsRefreshingUser(true);
      setLastRefreshTime(now);
      
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
    } finally {
      setIsRefreshingUser(false);
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
    // Use environment variable for API URL in production, proxy in development
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const fullUrl = apiUrl ? `${apiUrl}${url}` : url;
    
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
      const response = await fetch(fullUrl, config);

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
    avatarHydrating,
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
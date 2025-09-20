// Debug utility to help with auth issues
export const debugAuth = () => {
  console.log('=== Auth Debug Info ===');
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Token exists:', !!token);
  console.log('Token length:', token ? token.length : 0);
  console.log('User exists:', !!user);
  console.log('User data length:', user ? user.length : 0);
  
  if (token) {
    console.log('Token preview:', token.substring(0, 50) + '...');
    
    // Try to decode JWT to see payload size
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('JWT Payload:', payload);
      console.log('JWT Payload size:', JSON.stringify(payload).length);
    } catch (e) {
      console.log('Could not decode JWT:', e.message);
    }
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('User data:', userData);
      console.log('User data size:', JSON.stringify(userData).length);
    } catch (e) {
      console.log('Could not parse user data:', e.message);
    }
  }
  
  console.log('=== End Auth Debug ===');
};

// Clear all auth data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('Auth data cleared. Please refresh the page.');
};

// Make these available globally for debugging
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth;
  window.clearAuthData = clearAuthData;
}
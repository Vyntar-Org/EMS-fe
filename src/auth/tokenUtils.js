import axios from 'axios';

// Token refresh utility functions
const tokenUtils = {
  // Check if access token is expired
  isTokenExpired: (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  },

  // Refresh the access token using the refresh token
  refreshAccessToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post('https://bms.api.v1.vyntar.in/api/auth/refresh/', {
        refresh: refreshToken
      });

      if (response.data.success && response.data.data) {
        const { access: newAccessToken, refresh: newRefreshToken } = response.data.data;
        
        // Update tokens in localStorage
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('userData');
      localStorage.removeItem('fullUserData');
      localStorage.removeItem('activeApp');
      
      // Redirect to login
      window.location.href = '/login';
      throw error;
    }
  },

  // Get valid access token (refresh if needed)
  getValidAccessToken: async () => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    if (tokenUtils.isTokenExpired(accessToken)) {
      // Token is expired, try to refresh it
      await tokenUtils.refreshAccessToken();
      return localStorage.getItem('accessToken');
    }

    return accessToken;
  }
};

export default tokenUtils;
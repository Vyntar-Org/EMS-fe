import axios from 'axios';
import tokenUtils from './tokenUtils';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://bms.api.v1.vyntar.in/api'; // Default to production URL, can be overridden with environment variable

const loginApi = {
  /**
   * Login user with username and password
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise} - Promise that resolves to login response
   */
  login: async (username, password) => {
    console.log('Attempting login for user:', username);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: false // Using Authorization header instead of cookies
      });
      
      // Store tokens in localStorage - API returns tokens in data object
      let access_token = response.data.data?.access;
      let refresh_token = response.data.data?.refresh;
      
      // Fallback to direct properties if data object doesn't exist
      if (!access_token) access_token = response.data.access;
      if (!refresh_token) refresh_token = response.data.refresh;
      
      if (access_token) {
        localStorage.setItem('accessToken', access_token);
        console.log('Access token stored:', access_token);
      }
      if (refresh_token) {
        localStorage.setItem('refreshToken', refresh_token);
        console.log('Refresh token stored:', refresh_token);
      }
      
      console.log('Login successful, response:', response.data);
      return response.data;
    } catch (error) {
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        throw new Error(error.response.data.detail || 'Login failed');
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Network error: Unable to connect to server');
      } else {
        // Something else happened
        throw new Error('An error occurred during login');
      }
    }
  },

  /**
   * Logout user
   * @returns {Promise} - Promise that resolves to logout response
   */
  logout: async (refreshToken) => {
    console.log('Sending logout request with refresh token:', refreshToken);
    try {
      // Use the access token for logout (we won't refresh here as we're logging out)
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await axios.post(`${API_BASE_URL}/auth/logout/`, {
        refresh: refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        withCredentials: false
      });
      
      console.log('Logout response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(error.response?.data?.detail || 'Logout failed');
    }
  },

  /**
   * Check if user is authenticated
   * @returns {Promise} - Promise that resolves to authentication status
   */
  isAuthenticated: async () => {
    try {
      // Get a valid access token (will refresh if expired)
      const validToken = await tokenUtils.getValidAccessToken();
      
      const response = await axios.get(`${API_BASE_URL}/auth/user/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        withCredentials: false
      });
      
      return response.data;
    } catch (error) {
      return null; // User is not authenticated
    }
  },

  /**
   * Fetch user data after login
   * @returns {Promise} - Promise that resolves to user data
   */
  getUserData: async () => {
    try {
      // Get a valid access token (will refresh if expired)
      const validToken = await tokenUtils.getValidAccessToken();
      
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        withCredentials: false
      });
      
      console.log('User data fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response) {
        // Server responded with error status
        throw new Error(error.response.data.detail || 'Failed to fetch user data');
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Network error: Unable to connect to server');
      } else {
        // Something else happened
        throw new Error('An error occurred while fetching user data');
      }
    }
  }
};

export default loginApi;
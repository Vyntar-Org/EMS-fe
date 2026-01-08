import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ems.api.v1.vyntar.in/api'; // Default to production URL, can be overridden with environment variable

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
      
      // Store tokens in localStorage if present in response
      if (response.data.access) {
        localStorage.setItem('accessToken', response.data.access);
        console.log('Access token stored:', response.data.access);
      }
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
        console.log('Refresh token stored:', response.data.refresh);
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
      const response = await axios.post(`${API_BASE_URL}/auth/logout/`, {
        refresh: refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
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
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        return null; // No token available
      }
      
      const response = await axios.get(`${API_BASE_URL}/auth/user/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        withCredentials: false
      });
      
      return response.data;
    } catch (error) {
      return null; // User is not authenticated
    }
  }
};

export default loginApi;
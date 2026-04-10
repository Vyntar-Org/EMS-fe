// solarAnalyticsApi.js
import axios from 'axios';
import tokenUtils from '../tokenUtils';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://bms.api.v1.vyntar.in/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get a valid access token (will refresh if expired)
      const validToken = await tokenUtils.getValidAccessToken();
      
      if (validToken) {
        config.headers.Authorization = `Bearer ${validToken}`;
        console.log('Added authorization header to request:', config.url);
      } else {
        console.warn('No token found for request:', config.url);
      }
    } catch (error) {
      console.error('Error getting valid token:', error);
      throw error;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        // Attempt to refresh the token
        await tokenUtils.refreshAccessToken();
        
        // Retry the original request with the new token
        const newToken = localStorage.getItem('accessToken');
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(error.config);
      } catch (refreshError) {
        // If token refresh fails, clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('userData');
        localStorage.removeItem('fullUserData');
        localStorage.removeItem('activeApp');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Get all solar slaves/devices
 * @returns {Promise} Promise object represents the solar slaves data
 */
export const getSolarSlaves = async () => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    const response = await apiClient.get('/applications/solar/slaves/');
    console.log('Solar slaves API response:', response.data);
    
    if (response.data.success) {
      return response.data.data.slaves;
    } else {
      throw new Error(response.data.message || 'Failed to fetch solar slaves');
    }
  } catch (error) {
    console.error('Error fetching solar slaves:', error);
    if (error.response) {
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('Network Error: No response received from server');
      throw new Error('Network Error: Unable to connect to server');
    } else {
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};

/**
 * Get solar analytics data for specific parameters
 * @param {number} slaveId - The slave ID
 * @param {string[]} parameters - Array of parameter names (instant_flow, flow_temperature, pressure, inlet_temperature, outlet_temperature)
 * @param {string} fromDateTime - Start datetime in format "YYYY-MM-DD HH:mm:ss"
 * @param {string} toDateTime - End datetime in format "YYYY-MM-DD HH:mm:ss"
 * @returns {Promise} Promise object represents the solar analytics data
 */
export const getSolarAnalytics = async (slaveId, parameters, fromDateTime, toDateTime) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    const params = {
      slave_id: slaveId,
      parameters: parameters.join(','),
      from_datetime: fromDateTime,
      to_datetime: toDateTime
    };
    
    console.log(`Making solar analytics API call with params:`, params);
    
    const response = await apiClient.get('/applications/solar/analytics/', { params });
    console.log('Solar analytics API response:', response.data);
    
    if (response.data.success) {
      return response.data.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch solar analytics');
    }
  } catch (error) {
    console.error('Error fetching solar analytics:', error);
    if (error.response) {
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('Network Error: No response received from server');
      throw new Error('Network Error: Unable to connect to server');
    } else {
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};

export default apiClient;
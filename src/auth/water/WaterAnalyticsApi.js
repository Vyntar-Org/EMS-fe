// WaterAnalyticsApi.js
import axios from 'axios';
import tokenUtils from '../tokenUtils';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://bms.api.v1.vyntar.in/api/applications/water';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
 * Get water slave list data
 * @returns {Promise} Promise object represents the water slave list data
 */
export const getWaterSlaves = async () => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making water slave list API call with token:', validToken.substring(0, 20) + '...');
    
    const response = await apiClient.get('/slave-list/');
    
    console.log('Water slave list API response:', response);
    
    if (response.data.success) {
      return response.data.data.slaves;
    } else {
      throw new Error(response.data.message || 'Failed to fetch water slave list');
    }
  } catch (error) {
    console.error('Error fetching water slave list:', error);
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
 * Get water analytics data
 * @param {number} slaveId - The slave ID
 * @param {string} startDatetime - Start datetime in format 'YYYY-MM-DD HH:mm:ss'
 * @param {string} endDatetime - End datetime in format 'YYYY-MM-DD HH:mm:ss'
 * @param {number} limit - Number of records to fetch
 * @param {number} offset - Number of records to skip
 * @param {string} parameters - Comma-separated list of parameters to fetch
 * @returns {Promise} Promise object represents the water analytics data
 */
export const getWaterAnalytics = async (slaveId, startDatetime, endDatetime, limit = 30, offset = 0, parameters = 'consumption') => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log(`Making water analytics API call for slave ${slaveId}`);
    
    const params = new URLSearchParams({
      slave_id: slaveId.toString(),
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      limit: limit.toString(),
      offset: offset.toString(),
      parameters: parameters
    });
    
    const response = await apiClient.get(`/analytics/?${params}`);
    
    console.log('Water analytics API response:', response);
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch water analytics');
    }
  } catch (error) {
    console.error('Error fetching water analytics:', error);
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
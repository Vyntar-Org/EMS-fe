// solarLogsApi.js
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
 * Get solar slaves list to map slave IDs to names
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
    
    console.log('Making solar slaves API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.get('/applications/solar/slaves/');
    
    console.log('Solar slaves API response:', response);
    
    // Return the response data
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
 * Get solar logs data for a specific slave/device
 * @param {number} slaveId - The ID of the slave/device to fetch logs for
 * @param {string} startDatetime - Start datetime in format 'YYYY-MM-DD HH:mm:ss'
 * @param {string} endDatetime - End datetime in format 'YYYY-MM-DD HH:mm:ss'
 * @param {number} limit - Number of records to fetch (default: 30)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise} Promise object represents the solar logs data
 */
export const getSolarLogs = async (slaveId, startDatetime, endDatetime, limit = 30, offset = 0) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log(`Making solar logs API call for slave ${slaveId} with token:`, validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    // Format the API URL with query parameters
    const params = new URLSearchParams({
      slave_id: slaveId,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      limit: limit,
      offset: offset
    });
    
    const logsResponse = await apiClient.get(`/applications/solar/logs/?${params.toString()}`);
    
    console.log('Solar logs API response:', logsResponse);
    
    // Return the logs response
    if (logsResponse.data.success) {
      return logsResponse.data;
    } else {
      throw new Error(logsResponse.data.message || 'Failed to fetch solar logs');
    }
  } catch (error) {
    console.error('Error fetching solar logs:', error);
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
 * Get solar logs with slave names mapped
 * @param {number} slaveId - The ID of the slave/device to fetch logs for
 * @param {string} startDatetime - Start datetime in format 'YYYY-MM-DD HH:mm:ss'
 * @param {string} endDatetime - End datetime in format 'YYYY-MM-DD HH:mm:ss'
 * @param {number} limit - Number of records to fetch (default: 30)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise} Promise object represents the solar logs data with slave names
 */
export const getSolarLogsWithNames = async (slaveId, startDatetime, endDatetime, limit = 30, offset = 0) => {
  try {
    // Fetch both logs and slaves data
    const [logsData, slaves] = await Promise.all([
      getSolarLogs(slaveId, startDatetime, endDatetime, limit, offset),
      getSolarSlaves()
    ]);
    
    // Create a mapping of slave_id to slave_name from the slaves data
    let slavesMap = {};
    slaves.forEach(slave => {
      slavesMap[slave.slave_id] = slave.slave_name;
    });
    
    // Add slave name to each log entry
    if (logsData.data && logsData.data.logs) {
      logsData.data.logs.forEach(log => {
        log.slave_name = slavesMap[slaveId] || `Slave ${slaveId}`;
      });
    }
    
    return logsData;
  } catch (error) {
    console.error('Error fetching solar logs with names:', error);
    throw error;
  }
};

export default apiClient;
import axios from 'axios';
import tokenUtils from './tokenUtils';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://bms.api.v1.vyntar.in/api';

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
 * Get dashboard overview data
 * @returns {Promise} Promise object represents the dashboard overview data
 */
export const getDashboardOverview = async () => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making dashboard API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.get('/dashboards/overview/');
    console.log('Dashboard API response:', response);
    
    // Log the structure of the response data to understand it better
    console.log('Response data keys:', Object.keys(response.data));
    console.log('Success field:', response.data.success);
    
    // The API should return data in the format {success: true, message: 'Dashboard Overview', data: {...}, errors: null, meta: {...}}
    // But let's handle different possible structures
    if (response.data) {
      if (response.data.success === true) {
        // Standard format: {success: true, message: '...', data: {...}, ...}
        return response.data.data;
      } else if (response.data.hasOwnProperty('slaves') || response.data.hasOwnProperty('energy_consumption')) {
        // Direct format: {slaves: {...}, acte_im_total: ..., ...}
        console.log('Using direct data format');
        return response.data;
      } else {
        console.warn('Unexpected response format:', response.data);
        // Still try to return whatever data we got
        return response.data;
      }
    } else {
      throw new Error(response.data?.message || 'API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    // More detailed error reporting
    if (error.response) {
      // Server responded with error status
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error: No response received from server');
      console.error('Request details:', error.request);
      throw new Error('Network Error: Unable to connect to server');
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};

/**
 * Get slave list data
 * @returns {Promise} Promise object represents the slave list data
 */
export const getSlaveList = async () => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making slave list API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.get('/admin/slaves/');
    console.log('Slave list API response:', response);
    
    // The API returns data in multiple possible formats:
    // Format 1: {success: true, message: 'Slave List', data: [...], errors: null, meta: {...}}
    // Format 2: {data: {slaves: [...]}}
    // Format 3: {slaves: [...]}
    // Format 4: [...] (direct array)
    if (response.data && typeof response.data === 'object') {
      // Check if it's the format with data containing slaves: {data: {slaves: [...]}}
      if (response.data.data && response.data.data.slaves && Array.isArray(response.data.data.slaves)) {
        console.log('Using format with data.slaves array');
        return response.data.data.slaves;
      }
      // Check if it's the format with slaves directly in response.data: {slaves: [...]}
      else if (response.data.slaves && Array.isArray(response.data.slaves)) {
        console.log('Using format with slaves array directly in response.data');
        return response.data.slaves;
      }
      // Check if it's the standard format with success flag
      else if (response.data.success === true) {
        // Standard format: {success: true, message: '...', data: [...], ...}
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        // Direct array format
        console.log('Using direct array format for slave list');
        return response.data;
      } else {
        // Check if it has the expected fields
        if (response.data.hasOwnProperty('data') && response.data.hasOwnProperty('success')) {
          // Standard format
          if (response.data.success) {
            return response.data.data;
          } else {
            throw new Error(response.data.message || 'API returned unsuccessful response');
          }
        } else {
          // Unknown format, return as is
          console.warn('Unknown response format for slave list:', response.data);
          // Check if it has a data property with slaves
          if (response.data.data && Array.isArray(response.data.data)) {
            console.log('Using response.data.data as fallback');
            return response.data.data;
          }
          // Ensure we return an array to prevent downstream errors
          return Array.isArray(response.data) ? response.data : [];
        }
      }
    } else {
      throw new Error(response.data?.message || 'API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching slave list:', error);
    // More detailed error reporting
    if (error.response) {
      // Server responded with error status
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error: No response received from server');
      console.error('Request details:', error.request);
      throw new Error('Network Error: Unable to connect to server');
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};

/**
 * Get weekly consumption data for a specific slave
 * @param {number} slaveId - The ID of the slave
 * @returns {Promise} Promise object represents the weekly consumption data
 */
export const getSlaveWeeklyConsumption = async (slaveId) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making weekly consumption API call with slaveId:', slaveId, 'and token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.get(`/admin/charts/slave/acte-im-consumption-7days/?slave_id=${slaveId}`);
    console.log('Weekly consumption API response:', response);
    
    // The API returns data in multiple possible formats:
    // 1. Standard format: {success: true, message: '...', data: [...], ...}
    // 2. Direct format: {slave_id: 1, metric: '...', data: [...], ...}
    // 3. Direct array format: [...]
    if (response.data && typeof response.data === 'object') {
      if (response.data.success === true) {
        // Standard format: {success: true, message: '...', data: [...], ...}
        console.log('Using standard format for weekly consumption');
        return response.data.data;
      } else if (response.data.hasOwnProperty('data') && Array.isArray(response.data.data)) {
        // Direct format: {slave_id: 1, metric: '...', data: [...], ...}
        console.log('Using direct format with data field for weekly consumption');
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        // Direct array format
        console.log('Using direct array format for weekly consumption');
        return response.data;
      } else {
        // Unknown format
        console.warn('Unknown response format for weekly consumption:', response.data);
        throw new Error('API returned unexpected response format');
      }
    } else {
      throw new Error(response.data?.message || 'API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching weekly consumption:', error);
    // More detailed error reporting
    if (error.response) {
      // Server responded with error status
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error: No response received from server');
      console.error('Request details:', error.request);
      throw new Error('Network Error: Unable to connect to server');
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};


/**
 * Get hourly energy consumption trend data
 * @returns {Promise} Promise object represents the hourly energy consumption data
 */
export const getHourlyEnergyConsumptionTrend = async () => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making hourly energy consumption trend API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.get('/applications/energy/hourly-consumption-trend/');
    console.log('Hourly energy consumption trend API response:', response);
    
    // Process the response data to extract the series for chart
    if (response.data && response.data.success === true && response.data.data && response.data.data.data) {
      const consumptionData = response.data.data.data;
      
      // Extract hours and consumption values
      const hours = consumptionData.map(item => item.hour);
      const consumptionValues = consumptionData.map(item => item.consumption);
      
      return {
        hours,
        consumption: consumptionValues,
        meta: response.data.meta
      };
    } else {
      throw new Error(response.data?.message || 'API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching hourly energy consumption trend:', error);
    // More detailed error reporting
    if (error.response) {
      // Server responded with error status
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error: No response received from server');
      console.error('Request details:', error.request);
      throw new Error('Network Error: Unable to connect to server');
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};


/**
 * Get peak demand trend data for a specific slave
 * @param {number} slaveId - The ID of the slave
 * @returns {Promise} Promise object represents the peak demand trend data
 */
export const getPeakDemandTrend = async (slaveId) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making peak demand trend API call with slaveId:', slaveId, 'and token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.get(`/applications/energy/peak-demand-trend/?slave_id=${slaveId}`);
    console.log('Peak demand trend API response:', response);
    
    // Process the response data to extract the series for chart
    if (response.data && response.data.success === true && response.data.data && response.data.data.data) {
      const trendData = response.data.data.data;
      
      // Extract timestamps and values
      const timestamps = trendData.map(item => item.timestamp);
      const values = trendData.map(item => item.value);
      
      return {
        timestamps,
        values,
        meta: response.data.meta
      };
    } else {
      throw new Error(response.data?.message || 'API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching peak demand trend:', error);
    // More detailed error reporting
    if (error.response) {
      // Server responded with error status
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error: No response received from server');
      console.error('Request details:', error.request);
      throw new Error('Network Error: Unable to connect to server');
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};

export default apiClient;
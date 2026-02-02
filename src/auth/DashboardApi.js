import axios from 'axios';

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
  (config) => {
    // Check for different token names that might be stored
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added authorization header to request:', config.url);
    } else {
      console.warn('No token found for request:', config.url);
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
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
      window.location.href = '/login';
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
    // Check for different token names that might be stored
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making dashboard API call with token:', token.substring(0, 20) + '...');
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
    // Check for different token names that might be stored
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making slave list API call with token:', token.substring(0, 20) + '...');
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
    // Check for different token names that might be stored
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making weekly consumption API call with slaveId:', slaveId, 'and token:', token.substring(0, 20) + '...');
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

export default apiClient;
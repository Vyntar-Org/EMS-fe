import axios from 'axios';
import tokenUtils from '../tokenUtils'; // Ensure this path matches your project structure

// Create an axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://bms.api.v1.vyntar.in/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to include the auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const validToken = await tokenUtils.getValidAccessToken();
      if (validToken) {
        config.headers.Authorization = `Bearer ${validToken}`;
      }
    } catch (error) {
      console.error('Error getting valid token:', error);
      return Promise.reject(error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await tokenUtils.refreshAccessToken();
        const newToken = localStorage.getItem('accessToken');
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(error.config);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Fetches the list of STP slaves/devices
 */
export const getStpSlaveList = async () => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    if (!validToken) {
      throw new Error('Authentication token not found. Please log in first.');
    }

    // Endpoint specific to STP application
    const response = await apiClient.get('/applications/flowmeter/slave-list/');

    if (response.data && response.data.success === true) {
      return response.data.data.slaves || [];
    } else if (response.data && Array.isArray(response.data.slaves)) {
      return response.data.slaves;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else {
      throw new Error('API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching STP slave list:', error);
    throw error;
  }
};

/**
 * Fetches logs for a specific STP slave
 */
export const getStpLogs = async (slaveId, startDatetime, endDatetime, limit = 30, offset = 0) => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    if (!validToken) {
      throw new Error('Authentication token not found. Please log in first.');
    }

    const url = `/applications/flowmeter/logs/?slave_id=${slaveId}&start_datetime=${encodeURIComponent(startDatetime)}&end_datetime=${encodeURIComponent(endDatetime)}&limit=${limit}&offset=${offset}`;
    
    const response = await apiClient.get(url);

    if (response.data && response.data.success === true) {
      return {
        logs: response.data.data.logs || [],
        meta: response.data.meta || {}
      };
    } else if (response.data && Array.isArray(response.data.logs)) {
      return {
        logs: response.data.logs,
        meta: response.data.meta || {}
      };
    } else {
      throw new Error('API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching STP logs:', error);
    throw error;
  }
};
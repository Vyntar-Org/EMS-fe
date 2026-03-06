// WaterDashboardApi.js
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
        await tokenUtils.refreshAccessToken();
        const newToken = localStorage.getItem('accessToken');
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(error.config);
      } catch (refreshError) {
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
 * Get water dashboard overview data
 */
export const fetchWaterDashboardOverview = async () => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    const response = await apiClient.get('/dashboard-overview/');
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch water dashboard overview');
    }
  } catch (error) {
    console.error('Error fetching water dashboard overview:', error);
    throw error;
  }
};

/**
 * Get water slave list data
 */
export const getWaterSlaveList = async () => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    const response = await apiClient.get('/slave-list/');
    
    if (response.data.success) {
      return response.data.data.slaves;
    } else {
      throw new Error(response.data.message || 'Failed to fetch water slave list');
    }
  } catch (error) {
    console.error('Error fetching water slave list:', error);
    throw error;
  }
};

/**
 * Get daily consumption data for a specific slave
 * @param {string|number} slaveId - The ID of the slave
 * @returns {Promise} Promise object represents the daily consumption data
 */
export const fetchDailyConsumption = async (slaveId) => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log(`Fetching daily consumption for slave_id: ${slaveId}`);
    
    const response = await apiClient.get(`/daily-consumption/?slave_id=${slaveId}`);
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch daily consumption');
    }
  } catch (error) {
    console.error('Error fetching daily consumption:', error);
    throw error;
  }
};

export default apiClient;
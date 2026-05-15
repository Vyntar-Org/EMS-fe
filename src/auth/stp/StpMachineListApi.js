import axios from 'axios';
import tokenUtils from '../tokenUtils';

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
      const validToken = await tokenUtils.getValidAccessToken();
      if (validToken) {
        config.headers.Authorization = `Bearer ${validToken}`;
      }
    } catch (error) {
      console.error('Error getting valid token:', error);
      throw error;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
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
 * Get STP machine list data
 * @returns {Promise} Promise object represents the STP machine list data
 */
export const getStpMachineList = async () => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      throw new Error('Authentication token not found. Please log in first.');
    }

    const response = await apiClient.get('/applications/stp/machine-list/');
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch STP data');
    }
  } catch (error) {
    console.error('Error fetching STP machine list:', error);
    throw error;
  }
};

export default apiClient;
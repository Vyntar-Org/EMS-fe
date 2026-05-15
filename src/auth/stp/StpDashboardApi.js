import axios from 'axios';
import tokenUtils from '../tokenUtils'; // Adjust path as needed

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://bms.api.v1.vyntar.in/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
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
 * Get STP Dashboard Summary
 * @returns {Promise} Promise object represents the summary data
 */
export const getStpDashboardSummary = async () => {
  try {
    const response = await apiClient.get('/applications/stp/dashboard/summary/');
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch summary');
    }
  } catch (error) {
    console.error('Error fetching STP summary:', error);
    throw error;
  }
};

/**
 * Get STP Water Comparison Data
 * @returns {Promise} Promise object represents the water comparison data
 */
export const getStpWaterComparison = async () => {
  try {
    const response = await apiClient.get('/applications/stp/dashboard/water-comparison/');
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch water comparison');
    }
  } catch (error) {
    console.error('Error fetching water comparison:', error);
    throw error;
  }
};

/**
 * Get STP Historical Trends Data
 * @returns {Promise} Promise object represents the historical trends data
 */
export const getStpHistoricalTrends = async () => {
  try {
    const response = await apiClient.get('/applications/stp/dashboard/historical-trends/');
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch historical trends');
    }
  } catch (error) {
    console.error('Error fetching historical trends:', error);
    throw error;
  }
};
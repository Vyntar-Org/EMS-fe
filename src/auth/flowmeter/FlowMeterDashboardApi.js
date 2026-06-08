import axios from 'axios';
import tokenUtils from '../tokenUtils';

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
 * Get FlowMeter Slave List
 * @returns {Promise} Promise object represents the slave list data
 */
export const getFlowMeterSlaveList = async () => {
  try {
    const response = await apiClient.get('/applications/flowmeter/slave-list/');
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch slave list');
    }
  } catch (error) {
    console.error('Error fetching FlowMeter slave list:', error);
    throw error;
  }
};

/**
 * Get FlowMeter Dashboard Summary
 * @returns {Promise} Promise object represents the summary data
 */
export const getFlowMeterDashboardSummary = async () => {
  try {
    const response = await apiClient.get('/applications/flowmeter/dashboard/summary/');
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch summary');
    }
  } catch (error) {
    console.error('Error fetching FlowMeter summary:', error);
    throw error;
  }
};

/**
 * Get FlowMeter Water Comparison Data
 * @returns {Promise} Promise object represents the water comparison data
 */
export const getFlowMeterWaterComparison = async () => {
  try {
    const response = await apiClient.get('/applications/flowmeter/dashboard/water-comparison/');
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch water comparison');
    }
  } catch (error) {
    console.error('Error fetching FlowMeter water comparison:', error);
    throw error;
  }
};

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
 * Get FlowMeter Machine List
 * @returns {Promise} Promise object represents the machine list data
 */
export const getFlowMeterMachineList = async () => {
  try {
    const response = await apiClient.get('/applications/flowmeter/machine-list/');
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch machine list');
    }
  } catch (error) {
    console.error('Error fetching FlowMeter machine list:', error);
    throw error;
  }
};

/**
 * Get FlowMeter Machine List Trend
 * @param {Object} params - { slave_id, parameter }
 * @returns {Promise} Promise object represents the trend data
 */
export const getFlowMeterMachineListTrend = async (params) => {
  try {
    const response = await apiClient.get('/applications/flowmeter/machine-list-trend/', { params });
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch machine trends');
    }
  } catch (error) {
    console.error('Error fetching FlowMeter machine trends:', error);
    throw error;
  }
};

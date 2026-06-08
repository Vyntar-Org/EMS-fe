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
      return response.data.data.slaves;
    } else {
      throw new Error(response.data.message || 'Failed to fetch slave list');
    }
  } catch (error) {
    console.error('Error fetching FlowMeter slave list:', error);
    throw error;
  }
};

/**
 * Get FlowMeter Analytics Data
 * @param {string} slave_id - The ID of the slave device
 * @param {string} start_datetime - The start date and time (YYYY-MM-DD HH:mm:ss)
 * @param {string} end_datetime - The end date and time (YYYY-MM-DD HH:mm:ss)
 * @returns {Promise} Promise object represents the analytics data
 */
export const getFlowMeterAnalytics = async (slave_id, start_datetime, end_datetime) => {
  try {
    const response = await apiClient.get('/applications/flowmeter/analytics/', {
      params: {
        slave_id,
        start_datetime,
        end_datetime
      }
    });
    if (response.data.success) {
      return response.data.data.analytics;
    } else {
      throw new Error(response.data.message || 'Failed to fetch analytics data');
    }
  } catch (error) {
    console.error('Error fetching FlowMeter analytics:', error);
    throw error;
  }
};

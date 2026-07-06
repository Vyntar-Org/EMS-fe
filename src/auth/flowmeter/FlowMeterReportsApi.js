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
 * Get FlowMeter Daily Reports
 * @param {number} month - The month number (1-12)
 * @param {number} year - The year number
 * @returns {Promise} Promise object represents the report data
 */
export const getFlowMeterDailyReports = async (month, year) => {
  try {
    const response = await apiClient.get('/applications/flowmeter/daily-reports/', {
      params: { month, year }
    });
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch daily reports');
    }
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    throw error;
  }
};

/**
 * Get FlowMeter Daily Reading Reports
 * @param {number} year - The year number
 * @param {number} month - The month number (1-12)
 * @returns {Promise} Promise object represents the report data
 */
export const getFlowMeterDailyReadingReports = async (year, month) => {
  try {
    const response = await apiClient.get('/applications/flowmeter/daily-reading-reports/', {
      params: { year, month }
    });
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch daily reading reports');
    }
  } catch (error) {
    console.error('Error fetching daily reading reports:', error);
    throw error;
  }
};

/**
 * Get FlowMeter Monthly Reports
 * @param {number} year - The year number
 * @returns {Promise} Promise object represents the report data
 */
export const getFlowMeterMonthlyReports = async (year) => {
  try {
    const response = await apiClient.get('/applications/flowmeter/monthly-reports/', {
      params: { year }
    });
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch monthly reports');
    }
  } catch (error) {
    console.error('Error fetching monthly reports:', error);
    throw error;
  }
};

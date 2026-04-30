// compressorMachineListApi.js
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
 * Get compressor slaves data
 * @returns {Promise} Promise object represents the compressor slaves data
 */
export const getCompressorSlaves = async () => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log('Making compressor slaves API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);

    const response = await apiClient.get('/applications/compressor/slaves/');
    console.log('Compressor slaves API response:', response);

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch compressor slaves');
    }
  } catch (error) {
    console.error('Error fetching compressor slaves:', error);
    if (error.response) {
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('Network Error: No response received from server');
      throw new Error('Network Error: Unable to connect to server');
    } else {
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};

/**
 * Get compressor machine list data
 * @returns {Promise} Promise object represents the compressor machine list data
 */
export const getCompressorMachineList = async () => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log('Making compressor machine list API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);

    const [slavesResponse, machinesResponse] = await Promise.all([
      apiClient.get('/applications/compressor/slaves/'),
      apiClient.get('/applications/compressor/machine-list/'),
    ]);

    console.log('Compressor slaves API response:', slavesResponse);
    console.log('Compressor machines API response:', machinesResponse);

    let slaveIds = [];
    if (slavesResponse.data.success === true && slavesResponse.data.data && slavesResponse.data.data.slaves) {
      slaveIds = slavesResponse.data.data.slaves.map(slave => slave.slave_id);
    }

    let filteredMachines = [];
    if (machinesResponse.data.success === true && machinesResponse.data.data && machinesResponse.data.data.machines) {
      filteredMachines = machinesResponse.data.data.machines.filter(machine =>
        slaveIds.includes(machine.slave_id)
      );
    }

    const result = {
      success: machinesResponse.data.success,
      message: machinesResponse.data.message || 'Filtered Compressor Machine List',
      data: {
        machines: filteredMachines,
      },
      errors: machinesResponse.data.errors,
      meta: machinesResponse.data.meta,
    };

    console.log('Final enriched compressor machine list:', result);
    return result;
  } catch (error) {
    console.error('Error fetching compressor machine list:', error);
    if (error.response) {
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('Network Error: No response received from server');
      throw new Error('Network Error: Unable to connect to server');
    } else {
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};

/**
 * Get compressor machine trend data
 * @param {number} slaveId - The slave ID
 * @returns {Promise} Promise object represents the compressor trend data
 */
export const getCompressorMachineTrend = async (slaveId) => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log(`Making compressor trend API call for slave ${slaveId}`);

    const response = await apiClient.get(`/applications/compressor/machine-list-trend/?slave_id=${slaveId}`);
    console.log('Compressor trend API response:', response);

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch compressor trend data');
    }
  } catch (error) {
    console.error('Error fetching compressor trend:', error);
    if (error.response) {
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('Network Error: No response received from server');
      throw new Error('Network Error: Unable to connect to server');
    } else {
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};

/**
 * Get compressor downtime history for a specific slave
 * @param {number} slaveId - The slave ID
 * @param {number} hours - Time window in hours (e.g. 8 or 24)
 * @returns {Promise} Promise object represents the downtime history data
 */
export const getCompressorDowntimeHistory = async (slaveId, hours = 8) => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log(`Making compressor downtime history API call for slave ${slaveId}, hours: ${hours}`);

    const response = await apiClient.get(
      `/applications/compressor/downtime/history/?slave_id=${slaveId}&hours=${hours}`
    );
    console.log('Compressor downtime history API response:', response);

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch downtime history');
    }
  } catch (error) {
    console.error('Error fetching compressor downtime history:', error);
    if (error.response) {
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('Network Error: No response received from server');
      throw new Error('Network Error: Unable to connect to server');
    } else {
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};

export default apiClient;
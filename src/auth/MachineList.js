import axios from 'axios';
import tokenUtils from './tokenUtils';

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
      // Get a valid access token (will refresh if expired)
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
        // Attempt to refresh the token
        await tokenUtils.refreshAccessToken();
        
        // Retry the original request with the new token
        const newToken = localStorage.getItem('accessToken');
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(error.config);
      } catch (refreshError) {
        // If token refresh fails, clear tokens and redirect to login
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
 * Get machine list data
 * @returns {Promise} Promise object represents the machine list data
 */
export const getMachineList = async () => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making machine list API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    // Fetch both APIs to get complete machine information
    const [slavesResponse, machinesResponse] = await Promise.all([
      apiClient.get('/admin/slaves/'),
      apiClient.get('/admin/machine-list/')
    ]);
    
    console.log('Slaves API response:', slavesResponse);
    console.log('Machines API response:', machinesResponse);
    
    // Extract slave IDs from the slaves API
    let slaveIds = [];
    if (slavesResponse.data.success === true && slavesResponse.data.data && slavesResponse.data.data.slaves) {
      slaveIds = slavesResponse.data.data.slaves.map(slave => slave.slave_id);
    } else if (Array.isArray(slavesResponse.data)) {
      slaveIds = slavesResponse.data.map(slave => slave.slave_id);
    } else if (slavesResponse.data.slaves && Array.isArray(slavesResponse.data.slaves)) {
      slaveIds = slavesResponse.data.slaves.map(slave => slave.slave_id);
    }
    
    // Filter machines from machine-list API that match slave IDs from slaves API
    let filteredMachines = [];
    if (machinesResponse.data.success === true && machinesResponse.data.data && machinesResponse.data.data.machines) {
      filteredMachines = machinesResponse.data.data.machines.filter(machine => 
        slaveIds.includes(machine.slave_id)
      );
    }
    
    // Return the filtered response with only machines that exist in both APIs
    const result = {
      success: machinesResponse.data.success,
      message: machinesResponse.data.message || 'Filtered Machine List',
      data: {
        machines: filteredMachines
      },
      errors: machinesResponse.data.errors,
      meta: machinesResponse.data.meta
    };
    
    console.log('Final enriched machine list:', result);
    return result;
  
  } catch (error) {
    console.error('Error fetching machine list:', error);
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
 * Get active power chart data for a specific machine
 * @param {number} slaveId - The slave ID of the machine
 * @returns {Promise} Promise object represents the active power chart data
 */
export const getActivePowerChart = async (slaveId) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making active power chart API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.get(`/admin/machine-list/active-power-chart/?slave_id=${slaveId}`);
    console.log('Active power chart API response:', response);
    
    // The API should return data in the format {success: true, message: 'Last 6 hours power data', data: {...}, errors: null, meta: {...}}
    if (response.data) {
      if (response.data.success === true) {
        // Standard format: {success: true, message: '...', data: {...}, ...}
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
    console.error('Error fetching active power chart:', error);
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
 * Get voltage chart data for a specific machine
 * @param {number} slaveId - The slave ID of the machine
 * @returns {Promise} Promise object represents the voltage chart data
 */
export const getVoltageChart = async (slaveId) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making voltage chart API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.get(`/admin/machine-list/voltage/?slave_id=${slaveId}`);
    console.log('Voltage chart API response:', response);
    
    // The API should return data in the format {success: true, message: 'Last 6 hours voltage data', data: {...}, errors: null, meta: {...}}
    if (response.data) {
      if (response.data.success === true) {
        // Standard format: {success: true, message: '...', data: {...}, ...}
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
    console.error('Error fetching voltage chart:', error);
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
 * Get current chart data for a specific machine
 * @param {number} slaveId - The slave ID of the machine
 * @returns {Promise} Promise object represents the current chart data
 */
export const getCurrentChart = async (slaveId) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making current chart API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.get(`/admin/machine-list/current/?slave_id=${slaveId}`);
    console.log('Current chart API response:', response);
    
    // The API should return data in the format {success: true, message: 'Last 6 hours current data', data: {...}, errors: null, meta: {...}}
    if (response.data) {
      if (response.data.success === true) {
        // Standard format: {success: true, message: '...', data: {...}, ...}
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
    console.error('Error fetching current chart:', error);
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
 * Get power factor chart data for a specific machine
 * @param {number} slaveId - The slave ID of the machine
 * @returns {Promise} Promise object represents the power factor chart data
 */
export const getPowerFactorChart = async (slaveId) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making power factor chart API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.get(`/admin/machine-list/power-factor/?slave_id=${slaveId}`);
    console.log('Power factor chart API response:', response);
    
    // The API should return data in the format {success: true, message: 'Last 6 hours power factor data', data: {...}, errors: null, meta: {...}}
    if (response.data) {
      if (response.data.success === true) {
        // Standard format: {success: true, message: '...', data: {...}, ...}
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
    console.error('Error fetching power factor chart:', error);
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
 * Get frequency chart data for a specific machine
 * @param {number} slaveId - The slave ID of the machine
 * @returns {Promise} Promise object represents the frequency chart data
 */
export const getFrequencyChart = async (slaveId) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making frequency chart API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.get(`/admin/machine-list/frequency/?slave_id=${slaveId}`);
    console.log('Frequency chart API response:', response);
    
    // The API should return data in the format {success: true, message: 'Last 6 hours frequency data', data: {...}, errors: null, meta: {...}}
    if (response.data) {
      if (response.data.success === true) {
        // Standard format: {success: true, message: '...', data: {...}, ...}
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
    console.error('Error fetching frequency chart:', error);
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
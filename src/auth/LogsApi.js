import axios from 'axios';

// Create an axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://bms.api.v1.vyntar.in/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added authorization header to request:', config.url);
    } else {
      console.warn('No authentication token found for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response for ${response.config.url}:`, response.status, response.data);
    return response;
  },
  (error) => {
    console.error(`API Error for ${error.config?.url}:`, error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const getSlaveList = async () => {
  try {
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log('Making slave list API call with token:', token.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);

    const response = await apiClient.get('/admin/slaves/');
    console.log('Slave list API response:', response);

    if (response.data && typeof response.data === 'object') {
      if (response.data.success === true) {
        console.log('Using standard format for slave list');
        return response.data.data;
      } else if (response.data.hasOwnProperty('data') && Array.isArray(response.data.data)) {
        console.log('Using direct format with data field for slave list');
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('Using direct array format for slave list');
        return response.data;
      } else {
        console.warn('Unknown response format for slave list:', response.data);
        throw new Error('API returned unexpected response format');
      }
    } else {
      throw new Error(response.data?.message || 'API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching slave list:', error);
    if (error.response) {
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('Network Error: No response received from server');
      console.error('Request details:', error.request);
      throw new Error('Network Error: Unable to connect to server');
    } else {
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};

export const getDeviceLogs = async (slaveId, startDatetime, endDatetime, limit = 30, offset = 0) => {
  try {
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log('Making device logs API call with token:', token.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    // Format the URL with query parameters
    const url = `/admin/device-logs/?slave_id=${slaveId}&start_datetime=${encodeURIComponent(startDatetime)}&end_datetime=${encodeURIComponent(endDatetime)}&limit=${limit}&offset=${offset}`;
    
    const response = await apiClient.get(url);
    console.log('Device logs API response:', response);

    if (response.data && typeof response.data === 'object') {
      if (response.data.success === true) {
        console.log('Using standard format for device logs');
        // Return both data and meta information
        return {
          data: response.data.data,
          meta: response.data.meta || {}
        };
      } else if (response.data.hasOwnProperty('data') && Array.isArray(response.data.data)) {
        console.log('Using direct format with data field for device logs');
        // Return both data and meta information
        return {
          data: response.data.data,
          meta: response.data.meta || {}
        };
      } else if (Array.isArray(response.data)) {
        console.log('Using direct array format for device logs');
        // Return data in expected format
        return {
          data: response.data,
          meta: {}
        };
      } else {
        console.warn('Unknown response format for device logs:', response.data);
        throw new Error('API returned unexpected response format');
      }
    } else {
      throw new Error(response.data?.message || 'API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching device logs:', error);
    if (error.response) {
      console.error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
      throw new Error(`Server Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('Network Error: No response received from server');
      console.error('Request details:', error.request);
      throw new Error('Network Error: Unable to connect to server');
    } else {
      console.error('Request Error:', error.message);
      throw new Error(`Request Error: ${error.message}`);
    }
  }
};
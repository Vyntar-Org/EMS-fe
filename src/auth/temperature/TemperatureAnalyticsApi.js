import axios from 'axios';

// Import token utilities
import tokenUtils from '../tokenUtils';

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
  async (config) => {
    try {
      // Get a valid access token (will refresh if expired)
      const validToken = await tokenUtils.getValidAccessToken();
      
      if (validToken) {
        config.headers.Authorization = `Bearer ${validToken}`;
        console.log('Added authorization header to temperature request:', config.url);
      } else {
        console.warn('No authentication token found for temperature request:', config.url);
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

// Add a response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Temperature API Response for ${response.config.url}:`, response.status, response.data);
    return response;
  },
  (error) => {
    console.error(`Temperature API Error for ${error.config?.url}:`, error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Get all temperature slaves/devices
export const getTemperatureSlaves = async () => {
  try {
    const response = await apiClient.get('/applications/temperature/slaves/');
    return response.data;
  } catch (error) {
    console.error('Error fetching temperature slaves:', error);
    throw error;
  }
};

// Get temperature analytics data for a specific device
export const getTemperatureAnalytics = async (slaveId, parameters, fromDateTime, toDateTime) => {
  try {
    const params = {
      slave_id: slaveId,
      parameters: parameters.join(','),
      from_datetime: fromDateTime,
      to_datetime: toDateTime
    };
    
    const response = await apiClient.get('/applications/temperature/analytics/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching temperature analytics:', error);
    throw error;
  }
};
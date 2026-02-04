import axios from 'axios';
import tokenUtils from './tokenUtils';

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
        console.log('Added authorization header to request:', config.url);
      } else {
        console.warn('No authentication token found for request:', config.url);
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
    console.log(`API Response for ${response.config.url}:`, response.status, response.data);
    return response;
  },
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
    console.error(`API Error for ${error.config?.url}:`, error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API function for energy analytics
export const getEnergyAnalytics = async (slaveId, parameters, fromDatetime, toDatetime) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    // Build parameters string
    const paramsString = Array.isArray(parameters) && parameters.length > 0 
      ? parameters.join(',') 
      : 'ry_v,acte_im,actpr_t'; // Default to all parameters
    
    console.log('Making energy analytics API call with params:', {
      slave_id: slaveId,
      parameters: paramsString,
      from_datetime: fromDatetime,
      to_datetime: toDatetime
    });
    console.log('API Base URL:', apiClient.defaults.baseURL);

    const response = await apiClient.get('/applications/energy/analytics/', {
      params: {
        slave_id: slaveId,
        parameters: paramsString,
        from_datetime: fromDatetime,
        to_datetime: toDatetime
      }
    });
    
    console.log('Energy analytics API response:', response);

    if (response.data && typeof response.data === 'object') {
      if (response.data.success === true) {
        console.log('Energy analytics API success:', response.data.message);
        return response.data.data.data || response.data.data;
      } else {
        console.warn('Energy analytics API returned unsuccessful response:', response.data);
        throw new Error(response.data.message || 'API returned unsuccessful response');
      }
    } else {
      throw new Error(response.data?.message || 'API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching energy analytics:', error);
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

// API function to fetch devices/slaves
export const getDevices = async () => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log('Fetching devices with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);

    const response = await apiClient.get('/admin/slaves/');
    console.log('Devices API response:', response);

    if (response.data && typeof response.data === 'object') {
      if (response.data.success === true) {
        console.log('Devices API success:', response.data.message);
        return response.data.data.slaves || [];
      } else {
        console.warn('Devices API returned unsuccessful response:', response.data);
        throw new Error(response.data.message || 'API returned unsuccessful response');
      }
    } else {
      throw new Error(response.data?.message || 'API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching devices:', error);
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
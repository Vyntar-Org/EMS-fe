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

export const getTotalActiveEnergy7Days = async () => {
  try {
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log('Making total active energy 7 days API call with token:', token.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);

    const response = await apiClient.get('/admin/charts/acte-im-7days/');
    console.log('Total active energy 7 days API response:', response);

    if (response.data && typeof response.data === 'object') {
      if (response.data.success === true) {
        console.log('Using standard format for total active energy 7 days');
        return response.data.data;
      } else if (response.data.hasOwnProperty('series') && Array.isArray(response.data.series)) {
        console.log('Using response format with series field for total active energy 7 days');
        return response.data.series;
      } else if (response.data.hasOwnProperty('data') && Array.isArray(response.data.data)) {
        console.log('Using direct format with data field for total active energy 7 days');
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('Using direct array format for total active energy 7 days');
        return response.data;
      } else {
        console.warn('Unknown response format for total active energy 7 days:', response.data);
        console.log('Available keys in response:', Object.keys(response.data));
        throw new Error('API returned unexpected response format');
      }
    } else {
      throw new Error(response.data?.message || 'API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching total active energy 7 days:', error);
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

export const getConsumption7Days = async () => {
  try {
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log('Making consumption 7 days API call with token:', token.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);

    const response = await apiClient.get('/admin/charts/acte-im-consumption-7days/');
    console.log('Consumption 7 days API response:', response);

    if (response.data && typeof response.data === 'object') {
      if (response.data.success === true) {
        console.log('Using standard format for consumption 7 days');
        return response.data.data;
      } else if (response.data.hasOwnProperty('series') && Array.isArray(response.data.series)) {
        console.log('Using response format with series field for consumption 7 days');
        return response.data.series;
      } else if (response.data.hasOwnProperty('data') && Array.isArray(response.data.data)) {
        console.log('Using direct format with data field for consumption 7 days');
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('Using direct array format for consumption 7 days');
        return response.data;
      } else {
        console.warn('Unknown response format for consumption 7 days:', response.data);
        console.log('Available keys in response:', Object.keys(response.data));
        throw new Error('API returned unexpected response format');
      }
    } else {
      throw new Error(response.data?.message || 'API returned unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching consumption 7 days:', error);
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
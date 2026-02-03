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

// Using the specific endpoint you provided
export const fetchConsumptionData = async (month, year) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    const response = await apiClient.get('/reports/date-wise/consumption', {
      params: { month, year }
    });
    
    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching consumption data:', error);
    
    // If it's a CORS error, suggest using the proxy approach
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.log('CORS error detected. Consider using the proxy approach or enabling CORS on the server.');
    }
    
    throw error;
  }
};

// Fetch reading data
export const fetchReadingData = async (month, year) => {
  try {
    console.log(`Fetching reading data from: https://bms.api.v1.vyntar.in/api/reports/date-wise/reading?month=${month}&year=${year}`);
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    const response = await apiClient.get('https://bms.api.v1.vyntar.in/api/reports/date-wise/reading', {
      params: { month, year }
    });
    
    console.log('Reading API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching reading data:', error);
    
    // If it's a CORS error, suggest using the proxy approach
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.log('CORS error detected. Consider using the proxy approach or enabling CORS on the server.');
    }
    
    throw error;
  }
};

// Using the specific endpoint you provided
export const fetchConsumptionCostData = async (month, year) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    const response = await apiClient.get('/reports/date-wise/consumption-cost', {
      params: { month, year }
    });
    
    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching consumption data:', error);
    
    // If it's a CORS error, suggest using the proxy approach
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.log('CORS error detected. Consider using the proxy approach or enabling CORS on the server.');
    }
    
    throw error;
  }
};

// Fetch monthly reading data
export const fetchMonthlyConsumptionCostData = async (year) => {
  try {
    console.log(`Fetching monthly reading data from: https://bms.api.v1.vyntar.in/api/reports/month-wise/reading?year=${year}`);
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    const response = await apiClient.get('/reports/month-wise/consumption-cost', {
      params: { year }
    });
    
    console.log('Monthly Reading API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly reading data:', error);
    
    // If it's a CORS error, suggest using the proxy approach
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.log('CORS error detected. Consider using the proxy approach or enabling CORS on the server.');
    }
    
    throw error;
  }
};

// Fetch monthly consumption data
export const fetchMonthlyConsumptionData = async (year) => {
  try {
    console.log(`Fetching monthly consumption data from: https://bms.api.v1.vyntar.in/api/reports/month-wise/consumption?year=${year}`);
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    const response = await apiClient.get('/reports/month-wise/consumption', {
      params: { year }
    });
    
    console.log('Monthly Consumption API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly consumption data:', error);
    
    // If it's a CORS error, suggest using the proxy approach
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.log('CORS error detected. Consider using the proxy approach or enabling CORS on the server.');
    }
    
    throw error;
  }
};
import axios from 'axios';
import tokenUtils from '../tokenUtils';

// Create an axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://bms.api.v1.vyntar.in/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add Authorization header
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const validToken = await tokenUtils.getValidAccessToken();
      
      if (validToken) {
        config.headers.Authorization = `Bearer ${validToken}`;
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
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

// Fetch Daily Reports Data
export const fetchStpDailyReports = async (month, year) => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    if (!validToken) {
      throw new Error('Authentication token not found.');
    }

    const response = await apiClient.get('/applications/stp/daily-reports/', {
      params: { month, year }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching stp daily reports data:', error);
    throw error;
  }
};

// Fetch Monthly Reports Data
export const fetchStpMonthlyReports = async (year) => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    if (!validToken) {
      throw new Error('Authentication token not found.');
    }

    const response = await apiClient.get('/applications/stp/monthly-reports/', {
      params: { year }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching stp monthly reports data:', error);
    throw error;
  }
};

// Fetch Daily Reading Reports Data
export const fetchStpDailyReadingReports = async (year, month) => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    if (!validToken) {
      throw new Error('Authentication token not found.');
    }

    const response = await apiClient.get('/applications/stp/daily-reading-reports/', {
      params: { year, month }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching stp daily reading reports data:', error);
    throw error;
  }
};

// Fetch Slave List
export const fetchStpSlaveList = async () => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();
    if (!validToken) {
      throw new Error('Authentication token not found.');
    }

    const response = await apiClient.get('/applications/stp/slave-list/');
    
    return response.data;
  } catch (error) {
    console.error('Error fetching stp slave list:', error);
    throw error;
  }
};

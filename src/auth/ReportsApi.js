import axios from 'axios';

// Create an axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://bms.api.v1.vyntar.in/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

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

// Using the specific endpoint you provided
export const fetchConsumptionData = async (month, year) => {
  try {
    console.log(`Fetching from: https://bms.api.v1.vyntar.in/api/reports/date-wise/consumption?month=${month}&year=${year}`);
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
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
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
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

// Fetch monthly reading data
export const fetchMonthlyReadingData = async (year) => {
  try {
    console.log(`Fetching monthly reading data from: https://bms.api.v1.vyntar.in/api/reports/month-wise/reading?year=${year}`);
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    const response = await apiClient.get('/reports/month-wise/reading', {
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
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
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
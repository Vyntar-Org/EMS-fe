// solarMachineListApi.js
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
 * Get solar machine list data by combining both API responses
 * @returns {Promise} Promise object represents the solar machine list data
 */
export const getSolarMachineList = async () => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making solar machine list API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    // Fetch both slave list and machine list concurrently
    const [slavesResponse, machinesResponse] = await Promise.all([
      apiClient.get('/applications/solar/slaves/'),
      apiClient.get('/applications/solar/machine-list/')
    ]);
    
    console.log('Solar slaves API response:', slavesResponse);
    console.log('Solar machines API response:', machinesResponse);
    
    // Process the slaves response to get the slave mapping
    let slavesMap = {};
    if (slavesResponse.data.success === true && slavesResponse.data.data && slavesResponse.data.data.slaves) {
      // Build a map of slave_id to slave_name
      slavesResponse.data.data.slaves.forEach(slave => {
        slavesMap[slave.slave_id] = slave.slave_name;
      });
    }
    
    // Process the machines response to enrich with slave names
    let enrichedMachines = [];
    if (machinesResponse.data.success === true && machinesResponse.data.data && machinesResponse.data.data.machines) {
      enrichedMachines = machinesResponse.data.data.machines.map(machine => {
        // Get the slave name from the slaves API using the machine ID
        const slaveName = slavesMap[machine.id];
        
        // Map the solar data to the expected format
        return {
          slave_id: machine.id,
          name: slaveName || machine.name, // Use slave name if available, otherwise use machine name
          no: `S${machine.slave_index}`, // Create a serial number from slave_index
          status: machine.status,
          location: `Solar Plant - Area ${machine.slave_index}`, // Create a location from slave_index
          last_ts: machine.last_updated,
          latest: {
            flow_rate: machine.flowrate,
            inlet_temperature: machine.inlet_temperature,
            outlet_temperature: machine.outlet_temperature
          },
          energy: {
            today: machine.inlet_temperature * 2 || 0, // Using inlet_temperature * 2 as today's energy (placeholder)
            mtd: machine.inlet_temperature * 60 || 0 // Using inlet_temperature * 60 as monthly energy (placeholder)
          },
          totalizer: {
            value: machine.flowrate * 100 || 0, // Using flowrate * 100 as totalizer value (placeholder)
            timestamp: machine.last_updated,
          }
        };
      });
    }
    
    // Return the combined and enriched response
    const result = {
      success: machinesResponse.data.success,
      message: machinesResponse.data.message || 'Solar Machines List',
      data: {
        machines: enrichedMachines
      },
      errors: machinesResponse.data.errors,
      meta: machinesResponse.data.meta
    };
    
    console.log('Final enriched solar machine list:', result);
    return result;
  } catch (error) {
    console.error('Error fetching solar machine list:', error);
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
 * Get solar machine trend data
 * @param {number} slaveId - The slave ID
 * @param {string} parameter - The parameter to fetch (flowrate, inlet_temperature, or outlet_temperature)
 * @param {number} hours - Number of hours of data to fetch
 * @returns {Promise} Promise object represents the solar trend data
 */
export const getSolarMachineTrend = async (slaveId, parameter, hours = 6) => {
  try {
    // Get a valid access token (will refresh if expired)
    const validToken = await tokenUtils.getValidAccessToken();
    
    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log(`Making solar trend API call for slave ${slaveId}, parameter: ${parameter}, hours: ${hours}`);
    
    const response = await apiClient.get(
      `/applications/solar/machine-list-trend/?slave_id=${slaveId}&parameter=${parameter}&hours=${hours}`
    );
    
    console.log('Solar trend API response:', response);
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch solar trend data');
    }
  } catch (error) {
    console.error('Error fetching solar trend:', error);
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
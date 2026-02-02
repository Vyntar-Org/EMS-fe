import axios from 'axios';

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
  (config) => {
    // Check for different token names that might be stored
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added authorization header to request:', config.url);
    } else {
      console.warn('No token found for request:', config.url);
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
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Get temperature machine list data by combining both API responses
 * @returns {Promise} Promise object represents the temperature machine list data
 */
export const getTemperatureMachineList = async () => {
  try {
    // Check for different token names that might be stored
    let token = localStorage.getItem('token');
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }
    
    console.log('Making temperature machine list API call with token:', token.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);
    
    // Fetch both slave list and machine list concurrently
    const [slavesResponse, machinesResponse] = await Promise.all([
      apiClient.get('/applications/TEMPERATURE/slaves/'),
      apiClient.get('/applications/TEMPERATURE/machine-list/')
    ]);
    
    console.log('Temperature slaves API response:', slavesResponse);
    console.log('Temperature machines API response:', machinesResponse);
    
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
        
        // Map the temperature/humidity/battery data to the expected format
        return {
          slave_id: machine.id,
          name: slaveName || machine.name, // Use slave name if available, otherwise use machine name
          last_ts: machine.last_updated,
          latest: {
            acte_im: machine.temperature || 0, // Using temperature as acte_im for display
            rv: machine.temperature || 0,      // Using temperature as voltage for display
            ir: machine.humidity || 0,         // Using humidity as current (with °C unit in display)
            yv: machine.temperature || 0,      // Another temperature reading
            iy: machine.humidity || 0,         // Another humidity reading  
            bv: machine.battery || 0,          // Using battery as voltage
            ib: machine.battery || 0,          // Using battery as current
            actpr_t: machine.temperature || 0, // Using temperature as active power
            pf_t: 1.0,                        // Placeholder power factor
            fq: 50.0                          // Placeholder frequency
          },
          energy: {
            today: machine.temperature || 0,   // Using temperature as today's energy
            mtd: machine.temperature * 30 || 0 // Using temperature * 30 as monthly energy
          },
          status: machine.status
        };
      });
    }
    
    // Return the combined and enriched response
    const result = {
      success: machinesResponse.data.success,
      message: machinesResponse.data.message || 'Temperature Machines List',
      data: {
        machines: enrichedMachines
      },
      errors: machinesResponse.data.errors,
      meta: machinesResponse.data.meta
    };
    
    console.log('Final enriched temperature machine list:', result);
    return result;
  } catch (error) {
    console.error('Error fetching temperature machine list:', error);
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
import axios from 'axios';

// Using the specific endpoint you provided
export const fetchConsumptionData = async (month, year) => {
  try {
    console.log(`Fetching from: https://ems.api.v1.vyntar.in/api/reports/date-wise/consumption?month=${month}&year=${year}`);
    
    const response = await axios.get('https://ems.api.v1.vyntar.in/api/reports/date-wise/consumption', {
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
    console.log(`Fetching reading data from: https://ems.api.v1.vyntar.in/api/reports/date-wise/reading?month=${month}&year=${year}`);
    
    const response = await axios.get('https://ems.api.v1.vyntar.in/api/reports/date-wise/reading', {
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
    console.log(`Fetching monthly reading data from: https://ems.api.v1.vyntar.in/api/reports/month-wise/reading?year=${year}`);
    
    const response = await axios.get('https://ems.api.v1.vyntar.in/api/reports/month-wise/reading', {
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
    console.log(`Fetching monthly consumption data from: https://ems.api.v1.vyntar.in/api/reports/month-wise/consumption?year=${year}`);
    
    const response = await axios.get('https://ems.api.v1.vyntar.in/api/reports/month-wise/consumption', {
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
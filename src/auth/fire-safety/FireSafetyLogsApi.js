import apiClient from '../DashboardApi';
import tokenUtils from '../tokenUtils';

/**
 * Fetch fire-safety slaves list for logs UI.
 * Returns: Array<{ slave_id, slave_name }>
 */
export const getFireSafetyLogSlaves = async () => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();

    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log('Making fire-safety slaves (logs) API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);

    const response = await apiClient.get('/applications/fire-safety/slaves/');
    console.log('Fire-safety slaves (logs) API response:', response);

    const raw = response.data;
    let slaves = [];

    if (raw && raw.data && Array.isArray(raw.data.slaves)) {
      slaves = raw.data.slaves;
    } else if (raw && Array.isArray(raw.slaves)) {
      slaves = raw.slaves;
    } else if (Array.isArray(raw)) {
      slaves = raw;
    } else {
      console.warn('Unexpected fire-safety slaves (logs) response format:', raw);
      return [];
    }

    return slaves.map((s) => ({
      slave_id: s.slave_id ?? s.id,
      slave_name: s.slave_name ?? s.name,
    }));
  } catch (error) {
    console.error('Error fetching fire-safety slaves (logs):', error);

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

/**
 * Fetch fire-safety logs for given slave and time range.
 * startDatetime / endDatetime must be strings in "YYYY-MM-DD HH:mm:ss" (or "YYYY-MM-DD HH:mm") format.
 *
 * Returns:
 * {
 *   logs: Array<{ water_level, temperature, timestamp }>,
 *   meta: { count, total, limit, offset, has_more, ... }
 * }
 */
export const getFireSafetyLogs = async ({
  slaveId,
  startDatetime,
  endDatetime,
  limit = 30,
  offset = 0,
}) => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();

    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log(
      'Making fire-safety logs API call with',
      'slaveId:', slaveId,
      'start:', startDatetime,
      'end:', endDatetime,
      'limit:', limit,
      'offset:', offset,
      'token:', validToken.substring(0, 20) + '...'
    );
    console.log('API Base URL:', apiClient.defaults.baseURL);

    const response = await apiClient.get('/applications/fire-safety/logs/', {
      params: {
        slave_id: slaveId,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        limit,
        offset,
      },
    });
    console.log('Fire-safety logs API response:', response);

    const raw = response.data;

    if (raw && raw.success === true && raw.data && Array.isArray(raw.data.logs)) {
      return {
        logs: raw.data.logs,
        meta: raw.meta,
      };
    }

    console.warn('Unexpected fire-safety logs response format:', raw);
    return {
      logs: [],
      meta: raw?.meta ?? {},
    };
  } catch (error) {
    console.error('Error fetching fire-safety logs:', error);

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


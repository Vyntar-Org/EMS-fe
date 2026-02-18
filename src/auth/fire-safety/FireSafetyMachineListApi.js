import apiClient from '../DashboardApi';
import tokenUtils from '../tokenUtils';

/**
 * Normalize machine-list API response into the shape expected by the UI:
 * {
 *   data: {
 *     machines: [
 *       {
 *         slave_id,
 *         name,
 *         status,
 *         last_ts,
 *         latest: { temperature, water },
 *         energy: { today, mtd }
 *       }
 *     ]
 *   }
 * }
 */
export const getFireSafetyMachineList = async () => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();

    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log('Making fire-safety machine list API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);

    const response = await apiClient.get('/applications/fire-safety/machine-list/');
    console.log('Fire-safety machine list API response:', response);

    const raw = response.data;
    let machines = [];

    if (raw && raw.data && Array.isArray(raw.data.machines)) {
      // Standard format: { success, data: { machines: [...] }, ... }
      machines = raw.data.machines;
    } else if (raw && Array.isArray(raw.machines)) {
      // Alternate format: { machines: [...] }
      machines = raw.machines;
    } else if (Array.isArray(raw)) {
      // Direct array
      machines = raw;
    } else {
      console.warn('Unexpected fire-safety machine list response format:', raw);
      return { data: { machines: [] } };
    }

    const normalizedMachines = machines.map((m) => ({
      slave_id: m.slave_id ?? m.id ?? m.slave_index,
      name: m.name,
      status: m.status,
      last_ts: m.last_ts ?? m.last_updated,
      latest: {
        temperature: m.temperature ?? m.latest?.temperature ?? null,
        water: m.water_level ?? m.latest?.water ?? null,
      },
      // Fire-safety API does not provide energy today/MTD; keep zeroed for compatibility
      energy: {
        today: m.energy?.today ?? 0,
        mtd: m.energy?.mtd ?? 0,
      },
    }));

    return { data: { machines: normalizedMachines } };
  } catch (error) {
    console.error('Error fetching fire-safety machine list:', error);

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
 * Get fire-safety slaves list.
 * Returns a simple array of { slave_id, slave_name } objects.
 */
export const getFireSafetySlaves = async () => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();

    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log('Making fire-safety slaves API call with token:', validToken.substring(0, 20) + '...');
    console.log('API Base URL:', apiClient.defaults.baseURL);

    const response = await apiClient.get('/applications/fire-safety/slaves/');
    console.log('Fire-safety slaves API response:', response);

    const raw = response.data;
    let slaves = [];

    if (raw && raw.data && Array.isArray(raw.data.slaves)) {
      // Standard format from sample
      slaves = raw.data.slaves;
    } else if (raw && Array.isArray(raw.slaves)) {
      // Alternate format: { slaves: [...] }
      slaves = raw.slaves;
    } else if (Array.isArray(raw)) {
      // Direct array
      slaves = raw;
    } else {
      console.warn('Unexpected fire-safety slaves response format:', raw);
      return [];
    }

    return slaves.map((s) => ({
      slave_id: s.slave_id ?? s.id,
      slave_name: s.slave_name ?? s.name,
    }));
  } catch (error) {
    console.error('Error fetching fire-safety slaves:', error);

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
 * Get fire-safety machine trend data for a given slave and parameter.
 * @param {number|string} slaveId
 * @param {'temperature'|'water'} parameter
 * @param {number} hours
 * @returns {Promise<{data: Array<{timestamp: string, value: number}>, meta: any}>}
 */
export const getFireSafetyMachineTrend = async (slaveId, parameter, hours = 6) => {
  try {
    const validToken = await tokenUtils.getValidAccessToken();

    if (!validToken) {
      console.warn('No authentication token found. Please log in first.');
      throw new Error('Authentication token not found. Please log in first.');
    }

    console.log(
      'Making fire-safety machine trend API call with',
      'slaveId:', slaveId,
      'parameter:', parameter,
      'hours:', hours,
      'token:', validToken.substring(0, 20) + '...'
    );
    console.log('API Base URL:', apiClient.defaults.baseURL);

    const response = await apiClient.get('/applications/fire-safety/machine-list-trend/', {
      params: { slave_id: slaveId, parameter, hours },
    });
    console.log('Fire-safety machine trend API response:', response);

    const raw = response.data;

    if (raw && raw.success === true && raw.data && Array.isArray(raw.data.data)) {
      return {
        data: raw.data.data,
        meta: raw.meta,
      };
    }

    console.warn('Unexpected fire-safety machine trend response format:', raw);
    return {
      data: [],
      meta: raw?.meta ?? {},
    };
  } catch (error) {
    console.error('Error fetching fire-safety machine trend:', error);

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


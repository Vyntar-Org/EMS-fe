import tokenUtils from '../tokenUtils';

const API_BASE_URL = 'https://bms.api.v1.vyntar.in/api/applications/fire-safety';

// Fetch fire safety slaves/machines
export const fetchFireSafetySlaves = async () => {
    try {
        const token = await tokenUtils.getValidAccessToken();
        const response = await fetch(`${API_BASE_URL}/slaves/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching fire safety slaves:', error);
        throw error;
    }
};

// Fetch fire safety analytics data
export const fetchFireSafetyAnalytics = async (slaveId, parameters, fromDateTime, toDateTime) => {
    try {
        const token = await tokenUtils.getValidAccessToken();
        
        // Format parameters as comma-separated string
        const paramsString = Array.isArray(parameters) ? parameters.join(',') : parameters;
        
        // Format dates to YYYY-MM-DD HH:mm:ss format
        const fromDate = new Date(fromDateTime).toISOString().slice(0, 19).replace('T', ' ');
        const toDate = new Date(toDateTime).toISOString().slice(0, 19).replace('T', ' ');
        
        const url = `${API_BASE_URL}/analytics/?slave_id=${slaveId}&parameters=${paramsString}&from_datetime=${fromDate}&to_datetime=${toDate}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching fire safety analytics:', error);
        throw error;
    }
};
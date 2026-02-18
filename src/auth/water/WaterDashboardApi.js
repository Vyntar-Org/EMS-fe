import tokenUtils from '../tokenUtils';

const API_BASE_URL = 'https://bms.api.v1.vyntar.in/api/applications/water';

// Fetch water dashboard overview data
export const fetchWaterDashboardOverview = async () => {
    try {
        const token = await tokenUtils.getValidAccessToken();
        const response = await fetch(`${API_BASE_URL}/dashboard-overview/`, {
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
        console.error('Error fetching water dashboard overview:', error);
        throw error;
    }
};
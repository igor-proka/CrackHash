import axios from 'axios';

const API_URL = 'http://localhost:8080/api/hash'; // Points to Manager service exposed on host

export const crackHashRequest = async (hash, maxLength) => {
    try {
        const response = await axios.post(`${API_URL}/crack`, {
            hash,
            maxLength: parseInt(maxLength, 10)
        });
        return response.data;
    } catch (error) {
        console.error("Error submitting task:", error);
        throw error;
    }
};

export const getTaskStatus = async (requestId) => {
    try {
        const response = await axios.get(`${API_URL}/status`, {
            params: { requestId }
        });
        return response.data;
    } catch (error) {
        console.error("Error getting status:", error);
        throw error;
    }
};

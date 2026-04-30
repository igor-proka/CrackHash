import { managerApiClient } from './http';

export const crackHashRequest = async (hash, maxLength) => {
    const response = await managerApiClient.post('/hash/crack', {
        hash,
        maxLength: parseInt(maxLength, 10),
    });
    return response.data;
};

export const getTaskStatus = async (requestId) => {
    const response = await managerApiClient.get('/hash/status', {
        params: { requestId },
    });
    return response.data;
};

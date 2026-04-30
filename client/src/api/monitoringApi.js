import { monitoringApiClient } from './http';

export const getMonitoringRequests = async ({
    page = 0,
    size = 50,
    sort = 'newest',
    status = 'ALL',
} = {}) => {
    const response = await monitoringApiClient.get('/monitoring/requests', {
        params: {
            page,
            size,
            sort,
            status: status === 'ALL' ? undefined : status,
        },
    });
    return response.data;
};

export const getMonitoringRequestDetails = async (requestId) => {
    const response = await monitoringApiClient.get(`/monitoring/requests/${requestId}`);
    return response.data;
};

import type { MonitoringRequestDetails, MonitoringRequestQuery, MonitoringRequestsPage } from '../types';
import { monitoringApiClient, toApiError } from './http';

export const getMonitoringRequests = async ({
    page = 0,
    size = 50,
    sort = 'newest',
    status = 'ALL',
}: MonitoringRequestQuery = {}): Promise<MonitoringRequestsPage> => {
    try {
        const response = await monitoringApiClient.get<MonitoringRequestsPage>('/monitoring/requests', {
            params: {
                page,
                size,
                sort,
                status: status === 'ALL' ? undefined : status,
            },
        });
        return response.data;
    } catch (error) {
        throw toApiError(error);
    }
};

export const getMonitoringRequestDetails = async (requestId: string): Promise<MonitoringRequestDetails> => {
    try {
        const response = await monitoringApiClient.get<MonitoringRequestDetails>(`/monitoring/requests/${requestId}`);
        return response.data;
    } catch (error) {
        throw toApiError(error);
    }
};

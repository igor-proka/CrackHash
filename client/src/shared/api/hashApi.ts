import type { CrackResponse, StatusResponse } from '../types';
import { managerApiClient, toApiError } from './http';

export const crackHashRequest = async (hash: string, maxLength: number | string): Promise<CrackResponse> => {
    try {
        const response = await managerApiClient.post<CrackResponse>('/hash/crack', {
            hash,
            maxLength: Number.parseInt(String(maxLength), 10),
        });
        return response.data;
    } catch (error) {
        throw toApiError(error);
    }
};

export const getTaskStatus = async (requestId: string): Promise<StatusResponse> => {
    try {
        const response = await managerApiClient.get<StatusResponse>('/hash/status', {
            params: { requestId },
        });
        return response.data;
    } catch (error) {
        throw toApiError(error);
    }
};

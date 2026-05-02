import axios, { AxiosError } from 'axios';

interface ClientEnv {
    VITE_MANAGER_API_BASE_URL?: string;
    VITE_MONITORING_API_BASE_URL?: string;
}

const clientEnv = import.meta.env as ClientEnv;

export class ApiError extends Error {
    readonly status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export const toApiError = (error: unknown): ApiError => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError.response?.data?.message || axiosError.message || 'Request failed';
        return new ApiError(message, axiosError.response?.status);
    }

    if (error instanceof Error) {
        return new ApiError(error.message);
    }

    return new ApiError('Request failed');
};

export const managerApiClient = axios.create({
    baseURL: clientEnv.VITE_MANAGER_API_BASE_URL || '/api',
    timeout: 10000,
});

export const monitoringApiClient = axios.create({
    baseURL: clientEnv.VITE_MONITORING_API_BASE_URL || '/api',
    timeout: 10000,
});

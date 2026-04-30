import axios from 'axios';

const managerBaseURL = import.meta.env.VITE_MANAGER_API_BASE_URL || 'http://localhost:8082/api';
const monitoringBaseURL = import.meta.env.VITE_MONITORING_API_BASE_URL || 'http://localhost:8083/api';

export const managerApiClient = axios.create({
    baseURL: managerBaseURL,
    timeout: 10000,
});

export const monitoringApiClient = axios.create({
    baseURL: monitoringBaseURL,
    timeout: 10000,
});

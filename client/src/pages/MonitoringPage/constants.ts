import type { MonitoringStatusFilter } from '../../shared/types';

export const PAGE_SIZE = 50;
export const REQUEST_STATUSES: MonitoringStatusFilter[] = ['ALL', 'QUEUED', 'IN_PROGRESS', 'READY', 'ERROR'];

import { useState } from 'react';
import { getMonitoringRequests } from '../../shared/api';
import { usePolling } from '../../shared/lib';
import type { MonitoringRequestSummary, MonitoringSort, MonitoringStatusFilter } from '../../shared/types';
import { PAGE_SIZE } from './constants';

interface PaginationState {
    page: number;
    size: number;
    totalPages: number;
    totalItems: number;
}

export function useMonitoringRequests(unavailableMessage: string) {
    const [requests, setRequests] = useState<MonitoringRequestSummary[]>([]);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [sort, setSort] = useState<MonitoringSort>('newest');
    const [status, setStatus] = useState<MonitoringStatusFilter>('ALL');
    const [pagination, setPagination] = useState<PaginationState>({
        page: 0,
        size: PAGE_SIZE,
        totalPages: 0,
        totalItems: 0,
    });

    usePolling(async () => {
        try {
            const data = await getMonitoringRequests({
                page,
                size: PAGE_SIZE,
                sort,
                status,
            });

            if (data.totalPages > 0 && page >= data.totalPages) {
                setPage(data.totalPages - 1);
                return;
            }

            const items = data.items || [];
            setRequests(items);
            setPagination({
                page: data.page ?? page,
                size: data.size ?? PAGE_SIZE,
                totalPages: data.totalPages ?? 0,
                totalItems: data.totalItems ?? items.length,
            });
            setSelectedRequestId(previous => (
                items.some(request => request.requestId === previous)
                    ? previous
                    : items[0]?.requestId || null
            ));
            setError(null);
        } catch {
            setError(unavailableMessage);
        } finally {
            setLoading(false);
        }
    }, 3000, true, `${page}:${sort}:${status}:${unavailableMessage}`);

    const changeSort = (value: MonitoringSort) => {
        setLoading(true);
        setSort(value);
        setPage(0);
    };

    const changeStatus = (value: MonitoringStatusFilter) => {
        setLoading(true);
        setStatus(value);
        setPage(0);
    };

    const previousPage = () => {
        setLoading(true);
        setPage(value => Math.max(0, value - 1));
    };

    const nextPage = () => {
        setLoading(true);
        setPage(value => value + 1);
    };

    return {
        requests,
        selectedRequestId,
        loading,
        error,
        page,
        sort,
        status,
        pagination,
        setSelectedRequestId,
        changeSort,
        changeStatus,
        previousPage,
        nextPage,
    };
}

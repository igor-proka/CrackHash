import type { ChangeEvent } from 'react';
import type { AppTranslations, MonitoringSort, MonitoringStatusFilter } from '../../shared/types';
import { REQUEST_STATUSES } from './constants';

interface MonitoringFiltersProps {
    t: AppTranslations;
    sort: MonitoringSort;
    status: MonitoringStatusFilter;
    onSortChange: (sort: MonitoringSort) => void;
    onStatusChange: (status: MonitoringStatusFilter) => void;
}

export function MonitoringFilters({ t, sort, status, onSortChange, onStatusChange }: MonitoringFiltersProps) {
    const text = t.monitoring;

    const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
        onSortChange(event.target.value as MonitoringSort);
    };

    const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
        onStatusChange(event.target.value as MonitoringStatusFilter);
    };

    return (
        <div className="monitoring-controls">
            <label>
                {text.sortLabel}
                <select value={sort} onChange={handleSortChange}>
                    <option value="newest">{text.newestFirst}</option>
                    <option value="oldest">{text.oldestFirst}</option>
                </select>
            </label>
            <label>
                {text.statusFilter}
                <select value={status} onChange={handleStatusChange}>
                    {REQUEST_STATUSES.map(value => (
                        <option key={value} value={value}>
                            {value === 'ALL' ? text.allStatuses : t.status[value]}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}

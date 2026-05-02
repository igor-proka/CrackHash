import { compactId, formatDuration } from '../../shared/lib';
import type { AppTranslations, MonitoringRequestSummary } from '../../shared/types';
import { Icon, StatusBadge } from '../../shared/ui';
import { progressPercent } from './progress';

interface PaginationState {
    page: number;
    size: number;
    totalPages: number;
    totalItems: number;
}

interface RequestListProps {
    t: AppTranslations;
    requests: MonitoringRequestSummary[];
    selectedRequestId: string | null;
    loading: boolean;
    pagination: PaginationState;
    onSelectRequest: (requestId: string) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
}

export function RequestList({
    t,
    requests,
    selectedRequestId,
    loading,
    pagination,
    onSelectRequest,
    onPreviousPage,
    onNextPage,
}: RequestListProps) {
    const text = t.monitoring;
    const shownFrom = pagination.totalItems === 0 ? 0 : pagination.page * pagination.size + 1;
    const shownTo = Math.min(pagination.totalItems, (pagination.page + 1) * pagination.size);
    const totalPages = Math.max(1, pagination.totalPages);

    return (
        <>
            <h3><Icon name="list" size={17} />{text.requests}</h3>

            <div className="page-summary">
                <span>{text.showing} {shownFrom}-{shownTo} {text.of} {pagination.totalItems}</span>
                <span>{text.page} {pagination.page + 1}/{totalPages}</span>
            </div>

            {loading ? (
                <p className="empty-text">{text.loading}</p>
            ) : requests.length === 0 ? (
                <p className="empty-text">{text.emptyRequests}</p>
            ) : (
                <div className="request-items">
                    {requests.map(request => (
                        <button
                            key={request.requestId}
                            type="button"
                            className={`request-row ${selectedRequestId === request.requestId ? 'active' : ''}`}
                            onClick={() => onSelectRequest(request.requestId)}
                        >
                            <span className="request-main">
                                <span className="request-id-short">{compactId(request.requestId, 6)}</span>
                                <StatusBadge status={request.status} labels={t.status} />
                            </span>
                            <span className="request-meta">
                                {request.completedParts}/{request.partCount} {text.parts} | {formatDuration(request.totalDurationMs)}
                            </span>
                            <span className="progress-track" aria-hidden="true">
                                <span
                                    className="progress-fill"
                                    style={{ width: `${progressPercent(request.completedParts, request.partCount)}%` }}
                                />
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <div className="pagination-controls">
                <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={onPreviousPage}
                    disabled={pagination.page <= 0}
                >
                    {text.previousPage}
                </button>
                <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={onNextPage}
                    disabled={pagination.totalPages === 0 || pagination.page + 1 >= pagination.totalPages}
                >
                    {text.nextPage}
                </button>
            </div>
        </>
    );
}

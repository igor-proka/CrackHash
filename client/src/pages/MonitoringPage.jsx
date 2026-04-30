import { useEffect, useState } from 'react';
import { getMonitoringRequestDetails, getMonitoringRequests } from '../api/monitoringApi';
import { CopyButton } from '../components/CopyButton';
import { Icon } from '../components/Icon';
import { StatusBadge } from '../components/StatusBadge';
import { compactId, formatDateTime, formatDuration } from '../utils/format';

const PAGE_SIZE = 50;
const REQUEST_STATUSES = ['ALL', 'QUEUED', 'IN_PROGRESS', 'READY', 'ERROR'];

export function MonitoringPage({ t }) {
    const text = t.monitoring;
    const [requests, setRequests] = useState([]);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [sort, setSort] = useState('newest');
    const [status, setStatus] = useState('ALL');
    const [pagination, setPagination] = useState({
        page: 0,
        size: PAGE_SIZE,
        totalPages: 0,
        totalItems: 0,
    });

    useEffect(() => {
        let active = true;

        const loadRequests = async () => {
            try {
                const data = await getMonitoringRequests({
                    page,
                    size: PAGE_SIZE,
                    sort,
                    status,
                });
                if (!active) return;

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
                setSelectedRequestId(prev => (
                    items.some(request => request.requestId === prev)
                        ? prev
                        : items[0]?.requestId || null
                ));
                setError(null);
            } catch {
                if (active) {
                    setError(text.unavailable);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadRequests();
        const interval = setInterval(loadRequests, 3000);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [page, sort, status, text.unavailable]);

    useEffect(() => {
        if (!selectedRequestId) {
            setDetails(null);
            return undefined;
        }

        let active = true;

        const loadDetails = async () => {
            try {
                const data = await getMonitoringRequestDetails(selectedRequestId);
                if (active) {
                    setDetails(data);
                    setError(null);
                }
            } catch {
                if (active) {
                    setError(text.missingRequest);
                }
            }
        };

        loadDetails();
        const interval = setInterval(loadDetails, 2000);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [selectedRequestId, text.missingRequest]);

    const shownFrom = pagination.totalItems === 0 ? 0 : pagination.page * pagination.size + 1;
    const shownTo = Math.min(pagination.totalItems, (pagination.page + 1) * pagination.size);
    const totalPages = Math.max(1, pagination.totalPages);

    const handleSortChange = (event) => {
        setLoading(true);
        setSort(event.target.value);
        setPage(0);
    };

    const handleStatusChange = (event) => {
        setLoading(true);
        setStatus(event.target.value);
        setPage(0);
    };

    return (
        <section className="monitoring-page">
            <div className="monitoring-header">
                <div>
                    <h2>{text.title}</h2>
                    <p>{text.subtitle}</p>
                </div>
                <span className="live-indicator"><Icon name="refresh" size={14} />{text.autoRefresh}</span>
            </div>

            {error && (
                <div className="result-box status-error">
                    <Icon name="alert" size={17} />
                    {error}
                </div>
            )}

            <div className="monitoring-layout">
                <aside className="request-list panel">
                    <h3><Icon name="list" size={17} />{text.requests}</h3>

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
                                    onClick={() => setSelectedRequestId(request.requestId)}
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
                            onClick={() => {
                                setLoading(true);
                                setPage(value => Math.max(0, value - 1));
                            }}
                            disabled={pagination.page <= 0}
                        >
                            {text.previousPage}
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => {
                                setLoading(true);
                                setPage(value => value + 1);
                            }}
                            disabled={pagination.totalPages === 0 || pagination.page + 1 >= pagination.totalPages}
                        >
                            {text.nextPage}
                        </button>
                    </div>
                </aside>

                <div className="request-details">
                    {!details ? (
                        <section className="panel empty-details">
                            <h3><Icon name="database" size={17} />{text.selectRequest}</h3>
                            <p className="empty-text">{text.selectHint}</p>
                        </section>
                    ) : (
                        <RequestDetails details={details} t={t} />
                    )}
                </div>
            </div>
        </section>
    );
}

function RequestDetails({ details, t }) {
    const text = t.monitoring;
    const resultText = details.results?.length ? details.results.join(', ') : text.noMatchesYet;
    const progress = progressPercent(details.completedParts, details.partCount);

    return (
        <>
            <section className={`panel detail-overview status-${details.status.toLowerCase()}`}>
                <div className="detail-title-row">
                    <div className="detail-identity">
                        <div className="identity-item">
                            <span>{text.requestId}</span>
                            <strong title={details.requestId}>{compactId(details.requestId, 10)}</strong>
                        </div>
                        <div className="identity-item">
                            <span>{text.targetHash}</span>
                            <code className="hash-line">{details.hash}</code>
                        </div>
                    </div>
                    <div className="detail-actions">
                        <StatusBadge status={details.status} labels={t.status} />
                        <CopyButton text={details.requestId} title={text.copy} />
                    </div>
                </div>

                <div className="detail-progress">
                    <span className="progress-track" aria-hidden="true">
                        <span className="progress-fill" style={{ width: `${progress}%` }} />
                    </span>
                    <span>{progress}%</span>
                </div>

                <div className="metric-grid">
                    <Metric label={text.created} value={formatDateTime(details.createdAt)} />
                    <Metric label={text.completed} value={formatDateTime(details.completedAt)} />
                    <Metric label={text.totalTime} value={formatDuration(details.totalDurationMs)} />
                    <Metric label={text.progress} value={`${details.completedParts}/${details.partCount}`} />
                    <Metric label={text.maxLength} value={details.maxLength} />
                    <Metric label={text.results} value={resultText} wide />
                </div>

                {details.lastError && <div className="error-text">{details.lastError}</div>}
            </section>

            <section className="panel parts-panel">
                <h3><Icon name="server" size={17} />{text.taskParts}</h3>
                <div className="parts-table">
                    <div className="parts-row parts-head">
                        <span>{text.part}</span>
                        <span>{text.status}</span>
                        <span>{text.worker}</span>
                        <span>{text.started}</span>
                        <span>{text.running}</span>
                        <span>{text.total}</span>
                        <span>{text.result}</span>
                    </div>
                    {details.parts.map(part => (
                        <div key={part.id} className={`parts-row status-${part.status.toLowerCase()}`}>
                            <span className="part-number" data-label={text.part}>#{part.partNumber}</span>
                            <span data-label={text.status}><StatusBadge status={part.status} labels={t.status} /></span>
                            <span data-label={text.worker} title={part.workerId || ''}>{compactId(part.workerId, 5)}</span>
                            <span data-label={text.started}>{formatDateTime(part.startedAt)}</span>
                            <span data-label={text.running}>{formatDuration(part.runningMs)}</span>
                            <span data-label={text.total}>{formatDuration(part.totalDurationMs)}</span>
                            <span className="part-result" data-label={text.result}>
                                {part.results?.length ? part.results.join(', ') : part.processingError || part.lastError || '-'}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}

function progressPercent(completed, total) {
    if (!total) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
}

function Metric({ label, value, wide = false }) {
    return (
        <div className={`metric ${wide ? 'metric-wide' : ''}`}>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

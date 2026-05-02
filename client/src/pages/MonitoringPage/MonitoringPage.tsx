import type { AppTranslations } from '../../shared/types';
import { Icon } from '../../shared/ui';
import { MonitoringFilters } from './MonitoringFilters';
import { RequestDetails } from './RequestDetails';
import { RequestList } from './RequestList';
import { useMonitoringRequests } from './useMonitoringRequests';
import { useRequestDetails } from './useRequestDetails';

interface MonitoringPageProps {
    t: AppTranslations;
}

export function MonitoringPage({ t }: MonitoringPageProps) {
    const text = t.monitoring;
    const monitoring = useMonitoringRequests(text.unavailable);
    const requestDetails = useRequestDetails(monitoring.selectedRequestId, text.missingRequest);
    const error = requestDetails.error || monitoring.error;

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
                    <MonitoringFilters
                        t={t}
                        sort={monitoring.sort}
                        status={monitoring.status}
                        onSortChange={monitoring.changeSort}
                        onStatusChange={monitoring.changeStatus}
                    />
                    <RequestList
                        t={t}
                        requests={monitoring.requests}
                        selectedRequestId={monitoring.selectedRequestId}
                        loading={monitoring.loading}
                        pagination={monitoring.pagination}
                        onSelectRequest={monitoring.setSelectedRequestId}
                        onPreviousPage={monitoring.previousPage}
                        onNextPage={monitoring.nextPage}
                    />
                </aside>

                <div className="request-details">
                    {!requestDetails.details ? (
                        <section className="panel empty-details">
                            <h3><Icon name="database" size={17} />{text.selectRequest}</h3>
                            <p className="empty-text">{text.selectHint}</p>
                        </section>
                    ) : (
                        <RequestDetails details={requestDetails.details} t={t} />
                    )}
                </div>
            </div>
        </section>
    );
}

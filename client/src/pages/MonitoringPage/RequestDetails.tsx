import { compactId, formatDateTime, formatDuration } from '../../shared/lib';
import type { AppTranslations, MonitoringRequestDetails } from '../../shared/types';
import { CopyButton, StatusBadge } from '../../shared/ui';
import { progressPercent } from './progress';
import { TaskPartsTable } from './TaskPartsTable';

interface RequestDetailsProps {
    details: MonitoringRequestDetails;
    t: AppTranslations;
}

export function RequestDetails({ details, t }: RequestDetailsProps) {
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

            <TaskPartsTable parts={details.parts} t={t} />
        </>
    );
}

interface MetricProps {
    label: string;
    value: string | number;
    wide?: boolean;
}

function Metric({ label, value, wide = false }: MetricProps) {
    return (
        <div className={`metric ${wide ? 'metric-wide' : ''}`}>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

import { compactId, formatDateTime, formatDuration } from '../../shared/lib';
import type { AppTranslations, MonitoringTaskPart } from '../../shared/types';
import { Icon, StatusBadge } from '../../shared/ui';

interface TaskPartsTableProps {
    parts: MonitoringTaskPart[];
    t: AppTranslations;
}

export function TaskPartsTable({ parts, t }: TaskPartsTableProps) {
    const text = t.monitoring;

    return (
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
                {parts.map(part => (
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
    );
}

import type { AppTranslations, CrackHistoryItem } from '../../shared/types';
import { CopyButton, Icon, StatusBadge } from '../../shared/ui';

interface RequestHistoryProps {
    t: AppTranslations;
    tasks: CrackHistoryItem[];
}

export function RequestHistory({ t, tasks }: RequestHistoryProps) {
    const text = t.crack;

    return (
        <section className="tasks-section">
            <h2><Icon name="history" size={18} />{text.historyTitle}</h2>
            {tasks.length === 0 ? (
                <p className="empty-text">{text.emptyHistory}</p>
            ) : (
                <div className="task-list">
                    {tasks.map(task => (
                        <div key={task.requestId} className={`task-card status-${task.status.toLowerCase()}`}>
                            <div className="task-id-row">
                                <span className="task-id" title={task.requestId}>{task.requestId}</span>
                                <CopyButton text={task.requestId} title={text.copy} />
                            </div>
                            <StatusBadge status={task.status} labels={t.status} />
                            {task.status === 'READY' && task.data && (
                                <div className="task-result">
                                    {task.data.length > 0 ? task.data.join(', ') : text.noMatches}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

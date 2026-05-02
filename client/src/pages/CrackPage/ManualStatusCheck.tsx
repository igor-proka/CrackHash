import { useState, type FormEvent } from 'react';
import { getTaskStatus } from '../../shared/api';
import type { AppTranslations, StatusResponse } from '../../shared/types';
import { Icon, StatusBadge } from '../../shared/ui';

interface ManualStatusCheckProps {
    t: AppTranslations;
}

export function ManualStatusCheck({ t }: ManualStatusCheckProps) {
    const text = t.crack;
    const [manualRequestId, setManualRequestId] = useState('');
    const [manualStatus, setManualStatus] = useState<StatusResponse | null>(null);

    const handleCheckStatus = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!manualRequestId.trim()) {
            return;
        }

        try {
            setManualStatus(await getTaskStatus(manualRequestId.trim()));
        } catch {
            setManualStatus({ status: 'ERROR', data: null });
        }
    };

    return (
        <section className="panel">
            <h2><Icon name="search" size={18} />{text.checkTitle}</h2>
            <form onSubmit={handleCheckStatus} className="form">
                <label>
                    {text.requestIdLabel}
                    <input
                        type="text"
                        value={manualRequestId}
                        onChange={event => setManualRequestId(event.target.value)}
                        placeholder={text.requestIdPlaceholder}
                    />
                </label>
                <button type="submit" className="btn btn-secondary">
                    <Icon name="refresh" size={16} />
                    {text.check}
                </button>
            </form>
            {manualStatus && (
                <div className={`result-box status-${manualStatus.status.toLowerCase()}`}>
                    <div className="result-line">
                        <strong>{text.status}</strong>
                        <StatusBadge status={manualStatus.status} labels={t.status} />
                    </div>
                    {manualStatus.data && manualStatus.data.length > 0 && (
                        <div className="result-data">
                            <strong>{text.result}</strong>
                            <span>{manualStatus.data.join(', ')}</span>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

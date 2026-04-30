import { useEffect, useRef, useState } from 'react';
import { crackHashRequest, getTaskStatus } from '../api/hashApi';
import { CopyButton } from '../components/CopyButton';
import { Icon } from '../components/Icon';
import { StatusBadge } from '../components/StatusBadge';
import { md5 } from '../utils/md5';

export function CrackPage({ t }) {
    const text = t.crack;
    const [hash, setHash] = useState('');
    const [maxLength, setMaxLength] = useState(4);
    const [tasks, setTasks] = useState(() => {
        try { return JSON.parse(localStorage.getItem('crackhash_tasks')) || []; } catch { return []; }
    });
    const [md5Input, setMd5Input] = useState('');
    const [md5Result, setMd5Result] = useState('');
    const [manualRequestId, setManualRequestId] = useState('');
    const [manualStatus, setManualStatus] = useState(null);

    const tasksRef = useRef(tasks);
    tasksRef.current = tasks;

    useEffect(() => {
        localStorage.setItem('crackhash_tasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        const interval = setInterval(async () => {
            const activeTasks = tasksRef.current.filter(t => t.status === 'QUEUED' || t.status === 'IN_PROGRESS');
            for (const task of activeTasks) {
                try {
                    const res = await getTaskStatus(task.requestId);
                    setTasks(prev => prev.map(t =>
                        t.requestId === task.requestId ? { ...t, status: res.status, data: res.data } : t
                    ));
                } catch {
                    // Временные ошибки polling не ломают историю: следующий цикл попробует снова.
                }
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await crackHashRequest(hash.trim().toLowerCase(), maxLength);
            if (response?.requestId) {
                setTasks(prev => [
                    { requestId: response.requestId, status: 'QUEUED', data: null, hash: hash.trim().toLowerCase() },
                    ...prev,
                ]);
                setHash('');
            }
        } catch {
            alert(text.submitError);
        }
    };

    const handleCheckStatus = async (e) => {
        e.preventDefault();
        if (!manualRequestId.trim()) return;
        try {
            setManualStatus(await getTaskStatus(manualRequestId.trim()));
        } catch {
            setManualStatus({ status: 'ERROR', data: null });
        }
    };

    const generateMd5 = () => {
        if (md5Input) {
            setMd5Result(md5(md5Input));
        }
    };

    return (
        <>
            <div className="panels">
                <section className="panel">
                    <h2><Icon name="hash" size={18} />{text.title}</h2>
                    <form onSubmit={handleSubmit} className="form">
                        <label>
                            {text.hashLabel}
                            <input
                                type="text"
                                value={hash}
                                onChange={e => setHash(e.target.value)}
                                required
                                maxLength={32}
                                minLength={32}
                                pattern="[a-fA-F0-9]{32}"
                                placeholder={text.hashPlaceholder}
                            />
                        </label>
                        <label>
                            {text.maxLengthLabel}
                            <input
                                type="number"
                                value={maxLength}
                                onChange={e => setMaxLength(e.target.value)}
                                required
                                min={1}
                                max={6}
                            />
                        </label>
                        <button type="submit" className="btn btn-primary">
                            <Icon name="send" size={16} />
                            {text.submit}
                        </button>
                    </form>
                </section>

                <section className="panel">
                    <h2><Icon name="search" size={18} />{text.checkTitle}</h2>
                    <form onSubmit={handleCheckStatus} className="form">
                        <label>
                            {text.requestIdLabel}
                            <input
                                type="text"
                                value={manualRequestId}
                                onChange={e => setManualRequestId(e.target.value)}
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

                <section className="panel">
                    <h2><Icon name="key" size={18} />{text.generatorTitle}</h2>
                    <div className="form">
                        <label>
                            {text.wordLabel}
                            <input
                                type="text"
                                value={md5Input}
                                onChange={e => setMd5Input(e.target.value)}
                                placeholder={text.wordPlaceholder}
                            />
                        </label>
                        <button type="button" className="btn btn-accent" onClick={generateMd5}>
                            <Icon name="hash" size={16} />
                            {text.generate}
                        </button>
                        {md5Result && (
                            <div className="result-box copyable-row">
                                <div>
                                    <strong>{text.md5}</strong>
                                    <code className="hash-output">{md5Result}</code>
                                </div>
                                <CopyButton text={md5Result} title={text.copy} />
                            </div>
                        )}
                    </div>
                </section>
            </div>

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
        </>
    );
}

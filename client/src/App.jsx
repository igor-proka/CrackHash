import { useState, useEffect, useRef } from 'react';
import './App.css';
import { crackHashRequest, getTaskStatus } from './api';

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy">
            {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            )}
        </button>
    );
}

function App() {
    const [hash, setHash] = useState('');
    const [maxLength, setMaxLength] = useState(4);
    const [tasks, setTasks] = useState(() => {
        try { return JSON.parse(localStorage.getItem('crackhash_tasks')) || []; } catch { return []; }
    });
    const [theme, setTheme] = useState(() => localStorage.getItem('crackhash_theme') || 'dark');

    const [md5Input, setMd5Input] = useState('');
    const [md5Result, setMd5Result] = useState('');

    const [manualRequestId, setManualRequestId] = useState('');
    const [manualStatus, setManualStatus] = useState(null);

    const tasksRef = useRef(tasks);
    tasksRef.current = tasks;

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('crackhash_theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('crackhash_tasks', JSON.stringify(tasks));
    }, [tasks]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await crackHashRequest(hash, maxLength);
            if (response && response.requestId) {
                setTasks(prev => [
                    { requestId: response.requestId, status: 'IN_PROGRESS', data: null },
                    ...prev
                ]);
            }
        } catch {
            alert("Failed to submit request.");
        }
    };

    useEffect(() => {
        const interval = setInterval(async () => {
            const current = tasksRef.current;
            const activeTasks = current.filter(t => t.status === 'IN_PROGRESS');
            if (activeTasks.length === 0) return;
            for (const task of activeTasks) {
                try {
                    const res = await getTaskStatus(task.requestId);
                    if (res.status !== task.status) {
                        setTasks(prev => prev.map(t =>
                            t.requestId === task.requestId ? { ...t, status: res.status, data: res.data } : t
                        ));
                    }
                } catch { /* ignore */ }
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const generateMd5 = () => {
        if (!md5Input) return;
        setMd5Result(md5(md5Input));
    };

    const handleCheckStatus = async (e) => {
        e.preventDefault();
        if (!manualRequestId.trim()) return;
        try {
            const res = await getTaskStatus(manualRequestId.trim());
            setManualStatus(res);
        } catch {
            setManualStatus({ status: 'ERROR', data: null });
        }
    };

    return (
        <div className="app">
            <header className="header">
                <div className="header-top">
                    <h1>🔓 CrackHash</h1>
                    <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
                <p className="subtitle">Distributed MD5 Hash Cracking System</p>
            </header>

            <div className="panels">
                <section className="panel">
                    <h2>Crack Hash</h2>
                    <form onSubmit={handleSubmit} className="form">
                        <label>
                            MD5 Hash
                            <input type="text" value={hash} onChange={e => setHash(e.target.value)}
                                required maxLength={32} minLength={32}
                                placeholder="e2fc714c4727ee9395f324cd2e7f331f" />
                        </label>
                        <label>
                            Max Word Length
                            <input type="number" value={maxLength} onChange={e => setMaxLength(e.target.value)}
                                required min={1} max={10} />
                        </label>
                        <button type="submit" className="btn btn-primary">Submit Crack Request</button>
                    </form>
                </section>

                <section className="panel">
                    <h2>Check Status</h2>
                    <form onSubmit={handleCheckStatus} className="form">
                        <label>
                            Request ID
                            <input type="text" value={manualRequestId} onChange={e => setManualRequestId(e.target.value)}
                                placeholder="UUID of previous request" />
                        </label>
                        <button type="submit" className="btn btn-secondary">Check Status</button>
                    </form>
                    {manualStatus && (
                        <div className={`result-box status-${manualStatus.status.toLowerCase()}`}>
                            <strong>Status:</strong> <span className="badge">{manualStatus.status}</span>
                            {manualStatus.data && manualStatus.data.length > 0 && (
                                <div className="result-data"><strong>Result:</strong> {manualStatus.data.join(', ')}</div>
                            )}
                        </div>
                    )}
                </section>

                <section className="panel">
                    <h2>MD5 Generator</h2>
                    <div className="form">
                        <label>
                            Word
                            <input type="text" value={md5Input} onChange={e => setMd5Input(e.target.value)}
                                placeholder="e.g. abcd" />
                        </label>
                        <button type="button" className="btn btn-accent" onClick={generateMd5}>Generate MD5</button>
                        {md5Result && (
                            <div className="result-box copyable-row">
                                <div>
                                    <strong>MD5:</strong>
                                    <code className="hash-output">{md5Result}</code>
                                </div>
                                <CopyButton text={md5Result} />
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <section className="tasks-section">
                <h2>Task History</h2>
                {tasks.length === 0 ? (
                    <p className="empty-text">No tasks submitted yet in this session.</p>
                ) : (
                    <div className="task-list">
                        {tasks.map(task => (
                            <div key={task.requestId} className={`task-card status-${task.status.toLowerCase()}`}>
                                <div className="task-id-row">
                                    <span className="task-id">{task.requestId}</span>
                                    <CopyButton text={task.requestId} />
                                </div>
                                <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status}</span>
                                {task.status === 'READY' && task.data && (
                                    <div className="task-result">
                                        {task.data.length > 0 ? task.data.join(', ') : 'No matches found'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function md5(string) {
    function md5cycle(x, k) {
        var a = x[0], b = x[1], c = x[2], d = x[3];
        a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586); c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426); c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417); c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101); c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
        a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632); c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083); c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690); c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784); c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
        a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463); c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353); c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222); c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835); c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
        a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415); c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
        a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606); c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
        a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744); c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
        a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379); c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
        x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
    }
    function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b); }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
    function md51(s) {
        var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
        for (i = 64; i <= n; i += 64) { md5cycle(state, md5blk(s.substring(i - 64, i))); }
        s = s.substring(i - 64); var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < s.length; i++)tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) { md5cycle(state, tail); tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; }
        tail[14] = n * 8; md5cycle(state, tail); return state;
    }
    function md5blk(s) { var md5blks = [], i; for (i = 0; i < 64; i += 4) { md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24); } return md5blks; }
    var hex_chr = '0123456789abcdef'.split('');
    function rhex(n) { var s = '', j = 0; for (; j < 4; j++)s += hex_chr[(n >> (j * 8 + 4)) & 0x0f] + hex_chr[(n >> (j * 8)) & 0x0f]; return s; }
    function hex(x) { for (var i = 0; i < x.length; i++)x[i] = rhex(x[i]); return x.join(''); }
    function add32(a, b) { return (a + b) & 0xFFFFFFFF; }
    return hex(md51(string));
}

export default App;

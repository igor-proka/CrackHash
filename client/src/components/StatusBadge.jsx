export function StatusBadge({ status, labels }) {
    const normalized = String(status || 'unknown').toLowerCase();
    const text = labels?.[status] || status || labels?.UNKNOWN || 'UNKNOWN';
    return (
        <span className={`badge badge-${normalized}`}>
            <span className="badge-dot" />
            {text}
        </span>
    );
}

interface StatusBadgeProps {
    status: string | null | undefined;
    labels?: Partial<Record<string, string>>;
}

export function StatusBadge({ status, labels }: StatusBadgeProps) {
    const key = status || 'UNKNOWN';
    const normalized = String(key).toLowerCase();
    const text = labels?.[key] || key || labels?.UNKNOWN || 'UNKNOWN';
    return (
        <span className={`badge badge-${normalized}`}>
            <span className="badge-dot" />
            {text}
        </span>
    );
}

const paths = {
    activity: [
        <path key="1" d="M22 12h-4l-3 7L9 5l-3 7H2" />,
    ],
    alert: [
        <path key="1" d="M12 9v4" />,
        <path key="2" d="M12 17h.01" />,
        <path key="3" d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
    ],
    check: [
        <path key="1" d="m20 6-11 11-5-5" />,
    ],
    clock: [
        <circle key="1" cx="12" cy="12" r="9" />,
        <path key="2" d="M12 7v5l3 2" />,
    ],
    copy: [
        <rect key="1" x="9" y="9" width="11" height="11" rx="2" />,
        <path key="2" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />,
    ],
    database: [
        <ellipse key="1" cx="12" cy="5" rx="8" ry="3" />,
        <path key="2" d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />,
        <path key="3" d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />,
    ],
    hash: [
        <path key="1" d="M4 9h16" />,
        <path key="2" d="M4 15h16" />,
        <path key="3" d="M10 3 8 21" />,
        <path key="4" d="m16 3-2 18" />,
    ],
    history: [
        <path key="1" d="M3 12a9 9 0 1 0 3-6.7" />,
        <path key="2" d="M3 3v6h6" />,
        <path key="3" d="M12 7v5l4 2" />,
    ],
    key: [
        <circle key="1" cx="7.5" cy="14.5" r="4.5" />,
        <path key="2" d="m11 11 9-9" />,
        <path key="3" d="m16 6 2 2" />,
        <path key="4" d="m14 8 2 2" />,
    ],
    list: [
        <path key="1" d="M8 6h13" />,
        <path key="2" d="M8 12h13" />,
        <path key="3" d="M8 18h13" />,
        <path key="4" d="M3 6h.01" />,
        <path key="5" d="M3 12h.01" />,
        <path key="6" d="M3 18h.01" />,
    ],
    moon: [
        <path key="1" d="M21 12.8A8.5 8.5 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
    ],
    refresh: [
        <path key="1" d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />,
        <path key="2" d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />,
    ],
    search: [
        <circle key="1" cx="11" cy="11" r="7" />,
        <path key="2" d="m20 20-3.5-3.5" />,
    ],
    send: [
        <path key="1" d="m22 2-7 20-4-9-9-4Z" />,
        <path key="2" d="M22 2 11 13" />,
    ],
    server: [
        <rect key="1" x="3" y="4" width="18" height="7" rx="2" />,
        <rect key="2" x="3" y="13" width="18" height="7" rx="2" />,
        <path key="3" d="M7 8h.01" />,
        <path key="4" d="M7 17h.01" />,
    ],
    sun: [
        <circle key="1" cx="12" cy="12" r="4" />,
        <path key="2" d="M12 2v2" />,
        <path key="3" d="M12 20v2" />,
        <path key="4" d="m4.9 4.9 1.4 1.4" />,
        <path key="5" d="m17.7 17.7 1.4 1.4" />,
        <path key="6" d="M2 12h2" />,
        <path key="7" d="M20 12h2" />,
        <path key="8" d="m6.3 17.7-1.4 1.4" />,
        <path key="9" d="m19.1 4.9-1.4 1.4" />,
    ],
};

export function Icon({ name, size = 18, className = '', ...props }) {
    return (
        <svg
            className={`icon ${className}`.trim()}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {paths[name] || paths.activity}
        </svg>
    );
}

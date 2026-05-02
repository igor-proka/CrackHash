export const formatDateTime = (value: string | null | undefined): string => {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date(value));
};

export const formatDuration = (ms: number | null | undefined): string => {
    if (ms === null || ms === undefined) {
        return '-';
    }

    if (ms < 1000) {
        return `${ms} ms`;
    }

    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }

    return `${seconds}s`;
};

export const compactId = (value: string | null | undefined, size = 8): string => {
    if (!value) {
        return '-';
    }

    if (value.length <= size * 2 + 3) {
        return value;
    }

    return `${value.slice(0, size)}...${value.slice(-size)}`;
};

export function progressPercent(completed: number, total: number): number {
    if (!total) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
}

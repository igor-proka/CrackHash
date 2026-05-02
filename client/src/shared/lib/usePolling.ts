import { useEffect, useRef } from 'react';

export function usePolling(
    callback: () => void | Promise<void>,
    delayMs: number,
    enabled = true,
    refreshKey: unknown = undefined,
): void {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        let active = true;

        const run = async () => {
            if (!active) {
                return;
            }
            await callbackRef.current();
        };

        void run();
        const interval = window.setInterval(() => {
            void run();
        }, delayMs);

        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, [delayMs, enabled, refreshKey]);
}

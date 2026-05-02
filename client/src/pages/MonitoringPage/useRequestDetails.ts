import { useEffect, useState } from 'react';
import { getMonitoringRequestDetails } from '../../shared/api';
import { usePolling } from '../../shared/lib';
import type { MonitoringRequestDetails } from '../../shared/types';

export function useRequestDetails(requestId: string | null, missingRequestMessage: string) {
    const [details, setDetails] = useState<MonitoringRequestDetails | null>(null);
    const [error, setError] = useState<string | null>(null);

    usePolling(async () => {
        if (!requestId) {
            setDetails(null);
            return;
        }

        try {
            setDetails(await getMonitoringRequestDetails(requestId));
            setError(null);
        } catch {
            setError(missingRequestMessage);
        }
    }, 2000, Boolean(requestId), `${requestId}:${missingRequestMessage}`);

    useEffect(() => {
        if (!requestId) {
            setDetails(null);
            setError(null);
        }
    }, [requestId]);

    return {
        details: requestId ? details : null,
        error,
    };
}

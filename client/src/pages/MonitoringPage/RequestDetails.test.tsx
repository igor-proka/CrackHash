import { render, screen } from '@testing-library/react';
import { translations } from '../../shared/i18n';
import type { MonitoringRequestDetails } from '../../shared/types';
import { RequestDetails } from './RequestDetails';

const details: MonitoringRequestDetails = {
    requestId: 'request-1234567890',
    hash: '25ed1bcb423b0b7200f485fc5ff71c8e',
    maxLength: 2,
    status: 'READY',
    results: ['zz'],
    partCount: 10,
    completedParts: 10,
    lastError: null,
    createdAt: '2026-05-03T10:00:00.000Z',
    updatedAt: '2026-05-03T10:00:02.000Z',
    completedAt: '2026-05-03T10:00:02.000Z',
    totalDurationMs: 2000,
    parts: [
        {
            id: 'request-1234567890:1',
            requestId: 'request-1234567890',
            partNumber: 1,
            partCount: 10,
            status: 'COMPLETED',
            workerId: 'worker-1',
            attemptId: 'attempt-1',
            results: ['zz'],
            publishAttempts: 1,
            lastError: null,
            processingError: null,
            createdAt: '2026-05-03T10:00:00.000Z',
            updatedAt: '2026-05-03T10:00:02.000Z',
            publishedAt: '2026-05-03T10:00:00.500Z',
            startedAt: '2026-05-03T10:00:01.000Z',
            lastHeartbeatAt: '2026-05-03T10:00:01.500Z',
            completedAt: '2026-05-03T10:00:02.000Z',
            queueWaitMs: 1000,
            runningMs: 1000,
            totalDurationMs: 2000,
        },
    ],
};

describe('RequestDetails', () => {
    it('renders request metrics and task part rows', () => {
        render(<RequestDetails details={details} t={translations.en} />);

        expect(screen.getByText('25ed1bcb423b0b7200f485fc5ff71c8e')).toBeInTheDocument();
        expect(screen.getAllByText('zz')).toHaveLength(2);
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('worker-1')).toBeInTheDocument();
    });
});

import { render, screen, waitFor } from '@testing-library/react';
import { translations } from '../../shared/i18n';
import { MonitoringPage } from './MonitoringPage';
import { getMonitoringRequestDetails, getMonitoringRequests } from '../../shared/api';

jest.mock('../../shared/api', () => ({
    getMonitoringRequests: jest.fn(),
    getMonitoringRequestDetails: jest.fn(),
}));

const mockedGetMonitoringRequests = jest.mocked(getMonitoringRequests);
const mockedGetMonitoringRequestDetails = jest.mocked(getMonitoringRequestDetails);

describe('MonitoringPage', () => {
    beforeEach(() => {
        mockedGetMonitoringRequests.mockReset();
        mockedGetMonitoringRequestDetails.mockReset();
    });

    it('renders loading and then empty state', async () => {
        mockedGetMonitoringRequests.mockResolvedValue({
            items: [],
            page: 0,
            size: 50,
            totalPages: 0,
            totalItems: 0,
            sort: 'newest',
            status: null,
        });

        render(<MonitoringPage t={translations.en} />);

        expect(screen.getByText(translations.en.monitoring.loading)).toBeInTheDocument();
        expect(await screen.findByText(translations.en.monitoring.emptyRequests)).toBeInTheDocument();
    });

    it('renders unavailable error state', async () => {
        mockedGetMonitoringRequests.mockRejectedValue(new Error('network'));

        render(<MonitoringPage t={translations.en} />);

        expect(await screen.findByText(translations.en.monitoring.unavailable)).toBeInTheDocument();
    });

    it('renders request list and selected request details', async () => {
        mockedGetMonitoringRequests.mockResolvedValue({
            items: [{
                requestId: 'request-1234567890',
                hash: '25ed1bcb423b0b7200f485fc5ff71c8e',
                maxLength: 2,
                status: 'READY',
                results: ['zz'],
                partCount: 1,
                completedParts: 1,
                lastError: null,
                createdAt: null,
                updatedAt: null,
                completedAt: null,
                totalDurationMs: 1000,
            }],
            page: 0,
            size: 50,
            totalPages: 1,
            totalItems: 1,
            sort: 'newest',
            status: null,
        });
        mockedGetMonitoringRequestDetails.mockResolvedValue({
            requestId: 'request-1234567890',
            hash: '25ed1bcb423b0b7200f485fc5ff71c8e',
            maxLength: 2,
            status: 'READY',
            results: ['zz'],
            partCount: 1,
            completedParts: 1,
            lastError: null,
            createdAt: null,
            updatedAt: null,
            completedAt: null,
            totalDurationMs: 1000,
            parts: [],
        });

        render(<MonitoringPage t={translations.en} />);

        await waitFor(() => expect(mockedGetMonitoringRequestDetails).toHaveBeenCalledWith('request-1234567890'));
        expect(screen.getByText('reques...567890')).toBeInTheDocument();
        expect(screen.getByText('25ed1bcb423b0b7200f485fc5ff71c8e')).toBeInTheDocument();
    });
});

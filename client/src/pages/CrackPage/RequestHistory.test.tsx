import { render, screen } from '@testing-library/react';
import { translations } from '../../shared/i18n';
import type { CrackHistoryItem } from '../../shared/types';
import { RequestHistory } from './RequestHistory';

describe('RequestHistory', () => {
    it('renders empty state', () => {
        render(<RequestHistory t={translations.en} tasks={[]} />);

        expect(screen.getByText(translations.en.crack.emptyHistory)).toBeInTheDocument();
    });

    it('renders task statuses and ready results', () => {
        const tasks: CrackHistoryItem[] = [
            { requestId: 'ready-id', status: 'READY', data: ['zz'], hash: 'hash' },
            { requestId: 'queued-id', status: 'QUEUED', data: null, hash: 'hash' },
            { requestId: 'error-id', status: 'ERROR', data: null, hash: 'hash' },
        ];

        render(<RequestHistory t={translations.en} tasks={tasks} />);

        expect(screen.getByText('ready-id')).toBeInTheDocument();
        expect(screen.getByText('queued-id')).toBeInTheDocument();
        expect(screen.getByText('error-id')).toBeInTheDocument();
        expect(screen.getByText('zz')).toBeInTheDocument();
        expect(screen.getByText(translations.en.status.QUEUED)).toBeInTheDocument();
    });
});

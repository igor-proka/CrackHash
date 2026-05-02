import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { translations } from '../../shared/i18n';
import { MonitoringFilters } from './MonitoringFilters';

describe('MonitoringFilters', () => {
    it('notifies about sort and status changes', async () => {
        const user = userEvent.setup();
        const onSortChange = jest.fn();
        const onStatusChange = jest.fn();

        render(
            <MonitoringFilters
                t={translations.en}
                sort="newest"
                status="ALL"
                onSortChange={onSortChange}
                onStatusChange={onStatusChange}
            />,
        );

        await user.selectOptions(screen.getByLabelText(translations.en.monitoring.sortLabel), 'oldest');
        await user.selectOptions(screen.getByLabelText(translations.en.monitoring.statusFilter), 'READY');

        expect(onSortChange).toHaveBeenCalledWith('oldest');
        expect(onStatusChange).toHaveBeenCalledWith('READY');
    });
});

import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
    it('uses provided label for known status', () => {
        render(<StatusBadge status="READY" labels={{ READY: 'Ready label' }} />);

        expect(screen.getByText('Ready label')).toBeInTheDocument();
        expect(screen.getByText('Ready label')).toHaveClass('badge-ready');
    });

    it('falls back to unknown label', () => {
        render(<StatusBadge status={null} labels={{ UNKNOWN: 'Unknown label' }} />);

        expect(screen.getByText('Unknown label')).toBeInTheDocument();
        expect(screen.getByText('Unknown label')).toHaveClass('badge-unknown');
    });
});

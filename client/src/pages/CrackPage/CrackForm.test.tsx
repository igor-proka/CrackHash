import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { translations } from '../../shared/i18n';
import { CrackForm } from './CrackForm';

describe('CrackForm', () => {
    it('submits normalized hash and numeric max length', async () => {
        const user = userEvent.setup();
        const onSubmit = jest.fn<Promise<boolean>, [string, number]>().mockResolvedValue(true);
        render(<CrackForm text={translations.en.crack} submitError={null} onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText(translations.en.crack.hashLabel), 'ABCDEFABCDEFABCDEFABCDEFABCDEFAB');
        await user.clear(screen.getByLabelText(translations.en.crack.maxLengthLabel));
        await user.type(screen.getByLabelText(translations.en.crack.maxLengthLabel), '5');
        await user.click(screen.getByRole('button', { name: translations.en.crack.submit }));

        expect(onSubmit).toHaveBeenCalledWith('abcdefabcdefabcdefabcdefabcdefab', 5);
        expect(screen.getByLabelText(translations.en.crack.hashLabel)).toHaveValue('');
    });

    it('renders inline submit error instead of using alert', () => {
        render(<CrackForm text={translations.en.crack} submitError="Failed" onSubmit={jest.fn()} />);

        expect(screen.getByText(translations.en.crack.submitError)).toBeInTheDocument();
    });
});

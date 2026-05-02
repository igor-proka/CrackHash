import { useState, type FormEvent } from 'react';
import { Icon } from '../../shared/ui';
import type { CrackTranslations } from '../../shared/types';

interface CrackFormProps {
    text: CrackTranslations;
    submitError: string | null;
    onSubmit: (hash: string, maxLength: number) => Promise<boolean>;
}

export function CrackForm({ text, submitError, onSubmit }: CrackFormProps) {
    const [hash, setHash] = useState('');
    const [maxLength, setMaxLength] = useState('4');

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const submitted = await onSubmit(hash.trim().toLowerCase(), Number.parseInt(maxLength, 10));
        if (submitted) {
            setHash('');
        }
    };

    return (
        <section className="panel">
            <h2><Icon name="hash" size={18} />{text.title}</h2>
            <form onSubmit={handleSubmit} className="form">
                <label>
                    {text.hashLabel}
                    <input
                        type="text"
                        value={hash}
                        onChange={event => setHash(event.target.value)}
                        required
                        maxLength={32}
                        minLength={32}
                        pattern="[a-fA-F0-9]{32}"
                        placeholder={text.hashPlaceholder}
                    />
                </label>
                <label>
                    {text.maxLengthLabel}
                    <input
                        type="number"
                        value={maxLength}
                        onChange={event => setMaxLength(event.target.value)}
                        required
                        min={1}
                        max={6}
                    />
                </label>
                <button type="submit" className="btn btn-primary">
                    <Icon name="send" size={16} />
                    {text.submit}
                </button>
            </form>
            {submitError && (
                <div className="result-box status-error">
                    <Icon name="alert" size={17} />
                    {text.submitError}
                </div>
            )}
        </section>
    );
}

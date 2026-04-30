import { useState } from 'react';
import { Icon } from './Icon';

export function CopyButton({ text, title = 'Copy' }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text || '').then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button type="button" className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} title={title}>
            <Icon name={copied ? 'check' : 'copy'} size={15} />
        </button>
    );
}

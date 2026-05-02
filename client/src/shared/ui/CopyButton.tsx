import { useState } from 'react';
import { Icon } from './Icon';

interface CopyButtonProps {
    text: string | null | undefined;
    title?: string;
}

export function CopyButton({ text, title = 'Copy' }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        void navigator.clipboard.writeText(text || '').then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => undefined);
    };

    return (
        <button type="button" className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} title={title}>
            <Icon name={copied ? 'check' : 'copy'} size={15} />
        </button>
    );
}

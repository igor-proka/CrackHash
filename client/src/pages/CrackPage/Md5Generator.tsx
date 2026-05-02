import { useState } from 'react';
import { md5 } from '../../shared/lib';
import type { CrackTranslations } from '../../shared/types';
import { CopyButton, Icon } from '../../shared/ui';

interface Md5GeneratorProps {
    text: CrackTranslations;
}

export function Md5Generator({ text }: Md5GeneratorProps) {
    const [md5Input, setMd5Input] = useState('');
    const [md5Result, setMd5Result] = useState('');

    const generateMd5 = () => {
        if (md5Input) {
            setMd5Result(md5(md5Input));
        }
    };

    return (
        <section className="panel">
            <h2><Icon name="key" size={18} />{text.generatorTitle}</h2>
            <div className="form">
                <label>
                    {text.wordLabel}
                    <input
                        type="text"
                        value={md5Input}
                        onChange={event => setMd5Input(event.target.value)}
                        placeholder={text.wordPlaceholder}
                    />
                </label>
                <button type="button" className="btn btn-accent" onClick={generateMd5}>
                    <Icon name="hash" size={16} />
                    {text.generate}
                </button>
                {md5Result && (
                    <div className="result-box copyable-row">
                        <div>
                            <strong>{text.md5}</strong>
                            <code className="hash-output">{md5Result}</code>
                        </div>
                        <CopyButton text={md5Result} title={text.copy} />
                    </div>
                )}
            </div>
        </section>
    );
}

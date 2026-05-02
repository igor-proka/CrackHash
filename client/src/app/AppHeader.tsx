import type { AppTranslations, LanguageCode } from '../shared/types';
import { languageOptions } from '../shared/i18n';
import { Icon } from '../shared/ui/Icon';
import type { AppPage, ThemeName } from './types';

interface AppHeaderProps {
    activePage: AppPage;
    language: LanguageCode;
    theme: ThemeName;
    t: AppTranslations;
    onChangePage: (page: AppPage) => void;
    onChangeLanguage: (language: LanguageCode) => void;
    onToggleTheme: () => void;
}

export function AppHeader({
    activePage,
    language,
    theme,
    t,
    onChangePage,
    onChangeLanguage,
    onToggleTheme,
}: AppHeaderProps) {
    return (
        <header className="header">
            <div className="brand">
                <span className="brand-mark">
                    <img src="/favicon.svg" alt="" />
                </span>
                <div>
                    <h1>CrackHash</h1>
                    <p className="subtitle">{t.brandSubtitle}</p>
                </div>
            </div>

            <nav className="app-tabs" aria-label="Application sections">
                <button
                    type="button"
                    className={activePage === 'crack' ? 'active' : ''}
                    onClick={() => onChangePage('crack')}
                >
                    <Icon name="key" size={16} />
                    {t.tabs.crack}
                </button>
                <button
                    type="button"
                    className={activePage === 'monitoring' ? 'active' : ''}
                    onClick={() => onChangePage('monitoring')}
                >
                    <Icon name="activity" size={16} />
                    {t.tabs.monitoring}
                </button>
            </nav>

            <div className="header-actions">
                <div className="language-switch" aria-label={t.languageLabel}>
                    {languageOptions.map(option => (
                        <button
                            key={option.code}
                            type="button"
                            className={language === option.code ? 'active' : ''}
                            onClick={() => onChangeLanguage(option.code)}
                            title={`${t.languageLabel}: ${option.label}`}
                        >
                            <span className={`flag flag-${option.code}`} aria-hidden="true" />
                            {option.label}
                        </button>
                    ))}
                </div>

                <button className="theme-toggle" onClick={onToggleTheme} title={t.themeToggle} type="button">
                    <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
                </button>
            </div>
        </header>
    );
}

import { useEffect, useState } from 'react';
import './App.css';
import { CrackPage } from './pages/CrackPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { Icon } from './components/Icon';
import { languageOptions, translations } from './i18n';

function App() {
    const [theme, setTheme] = useState(() => localStorage.getItem('crackhash_theme') || 'dark');
    const [language, setLanguage] = useState(() => localStorage.getItem('crackhash_language') || 'en');
    const [activePage, setActivePage] = useState('crack');
    const t = translations[language] || translations.en;

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('crackhash_theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('lang', language);
        localStorage.setItem('crackhash_language', language);
    }, [language]);

    const toggleTheme = () => setTheme(value => value === 'dark' ? 'light' : 'dark');

    return (
        <div className="app">
            <div className="ambient-scene" aria-hidden="true">
                <span className="celestial" />
                <span className="star star-1" />
                <span className="star star-2" />
                <span className="star star-3" />
                <span className="star star-4" />
                <span className="star star-5" />
                <span className="star star-6" />
                <span className="star star-7" />
                <span className="star star-8" />
                <span className="star star-9" />
                <span className="star star-10" />
                <span className="star star-11" />
                <span className="star star-12" />
                <span className="cloud cloud-1" />
                <span className="cloud cloud-2" />
                <span className="cloud cloud-3" />
                <span className="cloud cloud-4" />
                <span className="cloud cloud-5" />
                <span className="cloud cloud-6" />
            </div>

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
                        onClick={() => setActivePage('crack')}
                    >
                        <Icon name="key" size={16} />
                        {t.tabs.crack}
                    </button>
                    <button
                        type="button"
                        className={activePage === 'monitoring' ? 'active' : ''}
                        onClick={() => setActivePage('monitoring')}
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
                                onClick={() => setLanguage(option.code)}
                                title={`${t.languageLabel}: ${option.label}`}
                            >
                                <span className={`flag flag-${option.code}`} aria-hidden="true" />
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <button className="theme-toggle" onClick={toggleTheme} title={t.themeToggle} type="button">
                        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
                    </button>
                </div>
            </header>

            {activePage === 'crack' ? <CrackPage t={t} /> : <MonitoringPage t={t} />}
        </div>
    );
}

export default App;

import { useEffect, useState } from 'react';
import { CrackPage } from '../pages/CrackPage/CrackPage';
import { MonitoringPage } from '../pages/MonitoringPage/MonitoringPage';
import { translations } from '../shared/i18n';
import { useLocalStorageState } from '../shared/lib';
import type { LanguageCode } from '../shared/types';
import { AmbientScene } from './AmbientScene';
import { AppHeader } from './AppHeader';
import type { AppPage, ThemeName } from './types';

const parseStoredString = <T extends string>(value: string) => value as T;
const serializeString = (value: string) => value;

export function App() {
    const [theme, setTheme] = useLocalStorageState<ThemeName>(
        'crackhash_theme',
        'dark',
        parseStoredString,
        serializeString,
    );
    const [language, setLanguage] = useLocalStorageState<LanguageCode>(
        'crackhash_language',
        'en',
        parseStoredString,
        serializeString,
    );
    const [activePage, setActivePage] = useState<AppPage>('crack');
    const t = translations[language] || translations.en;

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('lang', language);
    }, [language]);

    const toggleTheme = () => setTheme(value => (value === 'dark' ? 'light' : 'dark'));

    return (
        <div className="app">
            <AmbientScene />
            <AppHeader
                activePage={activePage}
                language={language}
                theme={theme}
                t={t}
                onChangePage={setActivePage}
                onChangeLanguage={setLanguage}
                onToggleTheme={toggleTheme}
            />
            {activePage === 'crack' ? <CrackPage t={t} /> : <MonitoringPage t={t} />}
        </div>
    );
}

export default App;

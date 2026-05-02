import type { KnownStatus } from './api';

export interface CrackTranslations {
    title: string;
    hashLabel: string;
    hashPlaceholder: string;
    maxLengthLabel: string;
    submit: string;
    submitError: string;
    checkTitle: string;
    requestIdLabel: string;
    requestIdPlaceholder: string;
    check: string;
    status: string;
    result: string;
    generatorTitle: string;
    wordLabel: string;
    wordPlaceholder: string;
    generate: string;
    md5: string;
    historyTitle: string;
    emptyHistory: string;
    noMatches: string;
    copy: string;
}

export interface MonitoringTranslations {
    title: string;
    subtitle: string;
    autoRefresh: string;
    unavailable: string;
    missingRequest: string;
    requests: string;
    showing: string;
    of: string;
    page: string;
    sortLabel: string;
    statusFilter: string;
    newestFirst: string;
    oldestFirst: string;
    allStatuses: string;
    previousPage: string;
    nextPage: string;
    loading: string;
    emptyRequests: string;
    parts: string;
    selectRequest: string;
    selectHint: string;
    requestId: string;
    targetHash: string;
    created: string;
    completed: string;
    totalTime: string;
    progress: string;
    maxLength: string;
    results: string;
    noMatchesYet: string;
    taskParts: string;
    part: string;
    status: string;
    worker: string;
    started: string;
    running: string;
    total: string;
    result: string;
    copy: string;
}

export type StatusLabels = Record<KnownStatus | 'UNKNOWN', string>;

export interface AppTranslations {
    languageLabel: string;
    brandSubtitle: string;
    tabs: {
        crack: string;
        monitoring: string;
    };
    themeToggle: string;
    crack: CrackTranslations;
    monitoring: MonitoringTranslations;
    status: StatusLabels;
}

export type LanguageCode = 'en' | 'ru';

export interface LanguageOption {
    code: LanguageCode;
    label: string;
}

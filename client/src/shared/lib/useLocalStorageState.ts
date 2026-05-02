import { useEffect, useState } from 'react';

type Parser<T> = (value: string) => T;
type Serializer<T> = (value: T) => string;

const defaultParser = <T,>(value: string): T => JSON.parse(value) as T;
const defaultSerializer = <T,>(value: T): string => JSON.stringify(value);

export function useLocalStorageState<T>(
    key: string,
    initialValue: T | (() => T),
    parser: Parser<T> = defaultParser,
    serializer: Serializer<T> = defaultSerializer,
) {
    const [value, setValue] = useState<T>(() => {
        const fallback = typeof initialValue === 'function'
            ? (initialValue as () => T)()
            : initialValue;

        try {
            const stored = localStorage.getItem(key);
            return stored === null ? fallback : parser(stored);
        } catch {
            return fallback;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, serializer(value));
        } catch {
            // Local storage - это улучшение; приватный режим просмотра/ошибки хранения не должны ломать UI.
        }
    }, [key, serializer, value]);

    return [value, setValue] as const;
}

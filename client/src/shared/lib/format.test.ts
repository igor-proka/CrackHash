import { compactId, formatDateTime, formatDuration } from './format';

describe('format utilities', () => {
    it('formats empty date and duration values safely', () => {
        expect(formatDateTime(null)).toBe('-');
        expect(formatDuration(undefined)).toBe('-');
    });

    it('formats durations by scale', () => {
        expect(formatDuration(420)).toBe('420 ms');
        expect(formatDuration(12_000)).toBe('12s');
        expect(formatDuration(65_000)).toBe('1m 5s');
        expect(formatDuration(3_665_000)).toBe('1h 1m 5s');
    });

    it('compacts long ids and keeps short ids unchanged', () => {
        expect(compactId('abc')).toBe('abc');
        expect(compactId('1234567890abcdef', 4)).toBe('1234...cdef');
    });

    it('formats valid dates with locale formatter', () => {
        expect(formatDateTime('2026-05-03T10:20:30.000Z')).not.toBe('-');
    });
});

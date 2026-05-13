import { describe, it, expect } from 'vitest';
import { dateAndTimeToStartsAt, startsAtToDate, startsAtToTime } from '@/lib/time';

describe('dateAndTimeToStartsAt', () => {
  it('creates a correct UTC date', () => {
    const result = dateAndTimeToStartsAt('2026-06-15', '19:00');
    expect(result.toISOString()).toBe('2026-06-15T19:00:00.000Z');
  });

  it('handles midnight', () => {
    const result = dateAndTimeToStartsAt('2026-01-01', '00:00');
    expect(result.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('handles end of day', () => {
    const result = dateAndTimeToStartsAt('2026-12-31', '23:59');
    expect(result.toISOString()).toBe('2026-12-31T23:59:00.000Z');
  });

  it('returns NaN for invalid date', () => {
    const result = dateAndTimeToStartsAt('invalid', '19:00');
    expect(Number.isNaN(result.getTime())).toBe(true);
  });
});

describe('startsAtToDate', () => {
  it('extracts date string from Date object', () => {
    const date = new Date('2026-06-15T19:30:00.000Z');
    expect(startsAtToDate(date)).toBe('2026-06-15');
  });

  it('handles dates at start of year', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    expect(startsAtToDate(date)).toBe('2026-01-01');
  });
});

describe('startsAtToTime', () => {
  it('extracts time string from Date object', () => {
    const date = new Date('2026-06-15T19:30:00.000Z');
    expect(startsAtToTime(date)).toBe('19:30');
  });

  it('handles midnight', () => {
    const date = new Date('2026-06-15T00:00:00.000Z');
    expect(startsAtToTime(date)).toBe('00:00');
  });

  it('handles single-digit hours', () => {
    const date = new Date('2026-06-15T09:05:00.000Z');
    expect(startsAtToTime(date)).toBe('09:05');
  });
});

describe('roundtrip', () => {
  it('date and time survive roundtrip through startsAt', () => {
    const originalDate = '2026-08-20';
    const originalTime = '14:30';

    const startsAt = dateAndTimeToStartsAt(originalDate, originalTime);
    expect(startsAtToDate(startsAt)).toBe(originalDate);
    expect(startsAtToTime(startsAt)).toBe(originalTime);
  });
});

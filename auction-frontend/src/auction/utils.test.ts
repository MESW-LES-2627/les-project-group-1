import { describe, expect, test } from 'bun:test';
import { formatTimeLeft, shortId } from './utils';

describe('formatTimeLeft', () => {
  test('formats ended, seconds, minutes, and days', () => {
    expect(formatTimeLeft(0)).toBe('Ended');
    expect(formatTimeLeft(1_500)).toBe('1s left');
    expect(formatTimeLeft(60_000)).toBe('1 min 0s left');
    expect(formatTimeLeft(86_400_000)).toBe('1 day 0 hours left');
  });
});

describe('shortId', () => {
  test('shows the first six characters or a placeholder for a missing id', () => {
    expect(shortId('abcdef123456')).toBe('abcdef');
    expect(shortId(null)).toBe('—');
  });
});

import { describe, expect, test } from 'bun:test';
import { formatTimeLeft, shortId } from '../auction/utils';

// This test suite verifies the utility functions used in the auction frontend.

/** 
 * Tests for the countdown formatting helper
 * 
 * Verifies:
 * 1. Zero values return "Ended"
 * 2. Under a minute return seconds left
 * 3. Over a minute return minutes and seconds left
 * 4. Over 24 hours return days and hours left
 * */ 
describe('formatTimeLeft', () => {
  test('formats ended, seconds, minutes, and days', () => {
    expect(formatTimeLeft(0)).toBe('Ended');
    expect(formatTimeLeft(1_500)).toBe('1s left');
    expect(formatTimeLeft(60_000)).toBe('1 min 0s left');
    expect(formatTimeLeft(86_400_000)).toBe('1 day 0 hours left');
  });
});

/** 
 * Tests for the ID trucation helper
 * 
 * Verifies:
 * 1. Long IDs are truncated to the first six characters
 * 2. Null IDs retutn a placeholder character ('-')
 * */ 
describe('shortId', () => {
  test('shows the first six characters or a placeholder for a missing id', () => {
    expect(shortId('abcdef123456')).toBe('abcdef');
    expect(shortId(null)).toBe('—');
  });
});

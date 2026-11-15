import { describe, it, expect } from 'vitest';
import { shortHash, formatEvidenceDate } from './evidence-format';

describe('shortHash', () => {
  it('keeps the first 6 and last 4 characters', () => {
    expect(shortHash('9f2c4e7a1b8d3c5e6f0a2b4c6d8e0f1a3b5c7d9e1f2a4b6c8d0e2f4a6b8ca41e')).toBe('9f2c4e…a41e');
  });

  it('shortens a 12 character string', () => {
    expect(shortHash('abcdef123456')).toBe('abcdef…' + '3456');
  });

  it('returns shorter input unchanged', () => {
    expect(shortHash('abcdef12345')).toBe('abcdef12345');
    expect(shortHash('')).toBe('');
  });
});

describe('formatEvidenceDate', () => {
  it('formats a Date in UTC', () => {
    expect(formatEvidenceDate(new Date('2026-11-15T14:32:00Z'))).toBe('15 Nov 2026 14:32 UTC');
  });

  it('accepts an ISO string and pads time', () => {
    expect(formatEvidenceDate('2026-01-05T03:07:59Z')).toBe('5 Jan 2026 03:07 UTC');
  });

  it('uses UTC even when the offset moves the local day', () => {
    expect(formatEvidenceDate('2026-12-31T23:59:00-05:00')).toBe('1 Jan 2027 04:59 UTC');
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatEvidenceDate('not a date')).toBe('');
  });
});

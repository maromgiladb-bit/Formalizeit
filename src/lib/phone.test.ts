import { describe, it, expect } from 'vitest';
import { filterPhoneChars, isValidPhone } from './phone';

describe('filterPhoneChars', () => {
  it('removes letters', () => {
    expect(filterPhoneChars('abc123def')).toBe('123');
  });

  it('keeps phone punctuation', () => {
    expect(filterPhoneChars('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
  });

  it('strips symbols that are not phone characters', () => {
    expect(filterPhoneChars('555*123#4567')).toBe('5551234567');
  });
});

describe('isValidPhone', () => {
  it('treats empty as valid (optional field)', () => {
    expect(isValidPhone('')).toBe(true);
    expect(isValidPhone('   ')).toBe(true);
  });

  it('accepts plausible numbers with formatting', () => {
    expect(isValidPhone('+1 (555) 123-4567')).toBe(true);
    expect(isValidPhone('052 5689900')).toBe(true);
  });

  it('rejects too-few digits', () => {
    expect(isValidPhone('12345')).toBe(false);
  });

  it('rejects too-many digits', () => {
    expect(isValidPhone('1234567890123456')).toBe(false);
  });
});

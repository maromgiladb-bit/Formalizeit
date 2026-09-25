import { describe, it, expect } from 'vitest';
import { deriveNdaTitle, confidentialityBelowTerm } from './ndaTerms';

describe('deriveNdaTitle', () => {
  it('uses the explicit title when provided', () => {
    expect(deriveNdaTitle('Partnership NDA 2025', 'Acme')).toBe('Partnership NDA 2025');
  });

  it('trims surrounding whitespace on the explicit title', () => {
    expect(deriveNdaTitle('  My NDA  ', 'Acme')).toBe('My NDA');
  });

  it('falls back to the Party B name when title is blank', () => {
    expect(deriveNdaTitle('', 'Acme Corp')).toBe('NDA — Acme Corp');
    expect(deriveNdaTitle('   ', 'Acme Corp')).toBe('NDA — Acme Corp');
  });

  it('falls back to a dated label when nothing is provided', () => {
    const d = new Date('2026-07-12T10:00:00Z');
    expect(deriveNdaTitle('', '', d)).toBe('NDA — 2026-07-12');
  });
});

describe('confidentialityBelowTerm', () => {
  it('warns when confidentiality is shorter than the term', () => {
    expect(confidentialityBelowTerm(12, 6)).toBe(true);
    expect(confidentialityBelowTerm('24', '12')).toBe(true);
  });

  it('does not warn when confidentiality is equal or longer', () => {
    expect(confidentialityBelowTerm(12, 12)).toBe(false);
    expect(confidentialityBelowTerm(12, 24)).toBe(false);
  });

  it('does not warn on empty or invalid input', () => {
    expect(confidentialityBelowTerm('', '')).toBe(false);
    expect(confidentialityBelowTerm(12, '')).toBe(false);
    expect(confidentialityBelowTerm(0, 0)).toBe(false);
    expect(confidentialityBelowTerm('abc', '5')).toBe(false);
  });
});

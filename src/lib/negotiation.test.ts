import { describe, it, expect } from 'vitest';
import { summarizeResponses, isFullyAccepted, humanizeField } from './negotiation';

describe('humanizeField', () => {
  it('formats party field keys', () => {
    expect(humanizeField('party_b_name')).toBe('Party B Name');
    expect(humanizeField('party_a_signatory_name')).toBe('Party A Signatory Name');
  });
});

describe('summarizeResponses', () => {
  it('groups responses by action', () => {
    const summary = summarizeResponses({
      party_b_name: { action: 'accepted' },
      party_b_address: { action: 'rejected' },
      governing_law: { action: 'countered', counterValue: 'State of New York' },
    });
    expect(summary.accepted).toEqual(['Party B Name']);
    expect(summary.rejected).toEqual(['Party B Address']);
    expect(summary.countered).toEqual(['Governing Law']);
  });

  it('ignores undefined entries', () => {
    const summary = summarizeResponses({ party_b_name: undefined });
    expect(summary.accepted).toEqual([]);
    expect(summary.rejected).toEqual([]);
    expect(summary.countered).toEqual([]);
  });
});

describe('isFullyAccepted', () => {
  it('is true when every response is accepted and no new suggestions', () => {
    expect(isFullyAccepted({ a: { action: 'accepted' }, b: { action: 'accepted' } }, false)).toBe(true);
    expect(isFullyAccepted({}, false)).toBe(true);
  });

  it('is false when anything is rejected or countered', () => {
    expect(isFullyAccepted({ a: { action: 'rejected' } }, false)).toBe(false);
    expect(isFullyAccepted({ a: { action: 'countered', counterValue: 'x' } }, false)).toBe(false);
  });

  it('is false when the reviewer proposed fresh changes', () => {
    expect(isFullyAccepted({ a: { action: 'accepted' } }, true)).toBe(false);
  });
});

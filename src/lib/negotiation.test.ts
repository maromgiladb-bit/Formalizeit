import { describe, it, expect } from 'vitest';
import {
  summarizeResponses,
  isFullyAccepted,
  humanizeField,
  normalizeResponses,
  applyNegotiationRound,
  pendingSuggestionsFromRevision,
} from './negotiation';

describe('pendingSuggestionsFromRevision', () => {
  const partyA = 'a@example.com';
  const partyB = 'b@example.com';

  it('returns nothing when there is no revision', () => {
    expect(pendingSuggestionsFromRevision(null, partyB)).toEqual({});
    expect(pendingSuggestionsFromRevision(undefined, partyB)).toEqual({});
  });

  it('returns the newest revision suggestions to the other party', () => {
    const rev = { submittedBy: partyA, suggestedChanges: { term_months: '18' } };
    expect(pendingSuggestionsFromRevision(rev, partyB)).toEqual({ term_months: '18' });
  });

  it('shows nothing to the party who submitted the revision', () => {
    const rev = { submittedBy: partyA, suggestedChanges: { term_months: '18' } };
    expect(pendingSuggestionsFromRevision(rev, partyA)).toEqual({});
    expect(pendingSuggestionsFromRevision(rev, 'A@Example.com')).toEqual({});
  });

  it('does not value-diff: a counter equal to the agreed value is still pending', () => {
    // "No, keep 12 months" must reach the other party as a response.
    const rev = { submittedBy: partyA, suggestedChanges: { term_months: '12' } };
    expect(pendingSuggestionsFromRevision(rev, partyB)).toEqual({ term_months: '12' });
  });

  it('ignores filledFields — those are already in the agreed document', () => {
    const rev = {
      submittedBy: partyB,
      filledFields: { party_b_name: 'Acme' },
      suggestedChanges: { governing_law: 'Delaware' },
    };
    expect(pendingSuggestionsFromRevision(rev, partyA)).toEqual({ governing_law: 'Delaware' });
  });

  it('drops blank suggestions', () => {
    const rev = { submittedBy: partyA, suggestedChanges: { a: '  ', b: '', c: 'x' } };
    expect(pendingSuggestionsFromRevision(rev, partyB)).toEqual({ c: 'x' });
  });

  it('round-trips with applyNegotiationRound so the newest counter always wins', () => {
    // Round 1: B proposes 24. Round 2: A counters 18. Round 3: B counters 20.
    // At every step the other side must be shown exactly the latest number.
    const content = { term_months: '12' };

    const r1 = applyNegotiationRound({ currentContent: content, suggestedChanges: { term_months: '24' } });
    const rev1 = { submittedBy: partyB, suggestedChanges: r1.outgoingSuggestions };
    expect(pendingSuggestionsFromRevision(rev1, partyA)).toEqual({ term_months: '24' });

    const r2 = applyNegotiationRound({
      currentContent: r1.newContent,
      responses: { term_months: { action: 'countered', counterValue: '18' } },
      incomingSuggestions: pendingSuggestionsFromRevision(rev1, partyA),
    });
    const rev2 = { submittedBy: partyA, suggestedChanges: r2.outgoingSuggestions };
    expect(pendingSuggestionsFromRevision(rev2, partyB)).toEqual({ term_months: '18' });
    expect(r2.newContent.term_months).toBe('12'); // still unagreed

    const r3 = applyNegotiationRound({
      currentContent: r2.newContent,
      responses: { term_months: { action: 'countered', counterValue: '20' } },
      incomingSuggestions: pendingSuggestionsFromRevision(rev2, partyB),
    });
    const rev3 = { submittedBy: partyB, suggestedChanges: r3.outgoingSuggestions };
    expect(pendingSuggestionsFromRevision(rev3, partyA)).toEqual({ term_months: '20' });
    // And A's own stale counter is not shown back to A.
    expect(pendingSuggestionsFromRevision(rev3, partyB)).toEqual({});

    // Round 4: A accepts 20 — it lands in the agreed document, nothing left pending.
    const r4 = applyNegotiationRound({
      currentContent: r3.newContent,
      responses: { term_months: { action: 'accepted' } },
      incomingSuggestions: pendingSuggestionsFromRevision(rev3, partyA),
    });
    expect(r4.newContent.term_months).toBe('20');
    expect(r4.fullyAccepted).toBe(true);
    const rev4 = { submittedBy: partyA, suggestedChanges: r4.outgoingSuggestions };
    expect(pendingSuggestionsFromRevision(rev4, partyB)).toEqual({});
  });
});

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

describe('normalizeResponses', () => {
  it('downgrades a counter with no usable value to a rejection', () => {
    expect(normalizeResponses({ a: { action: 'countered', counterValue: '' } })).toEqual({
      a: { action: 'rejected' },
    });
    expect(normalizeResponses({ a: { action: 'countered', counterValue: '   ' } })).toEqual({
      a: { action: 'rejected' },
    });
    expect(normalizeResponses({ a: { action: 'countered' } })).toEqual({
      a: { action: 'rejected' },
    });
  });

  it('trims a real counter and passes other actions through', () => {
    expect(
      normalizeResponses({
        a: { action: 'countered', counterValue: '  State of New York  ' },
        b: { action: 'accepted' },
        c: { action: 'rejected' },
        d: undefined,
      }),
    ).toEqual({
      a: { action: 'countered', counterValue: 'State of New York' },
      b: { action: 'accepted' },
      c: { action: 'rejected' },
    });
  });
});

describe('applyNegotiationRound', () => {
  const base = { party_b_name: 'Acme', governing_law: 'Delaware', term: '2 years' };

  it('writes plain filled fields into the agreed document', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      filledFields: { party_b_address: '1 Main St' },
    });
    expect(r.newContent.party_b_address).toBe('1 Main St');
    expect(r.appliedFilledFields).toEqual({ party_b_address: '1 Main St' });
    expect(r.hasOpenItems).toBe(false);
    expect(r.fullyAccepted).toBe(true);
  });

  it('leaves unrelated keys untouched', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      responses: { governing_law: { action: 'rejected' } },
    });
    expect(r.newContent.party_b_name).toBe('Acme');
    expect(r.newContent.term).toBe('2 years');
  });

  it('accepts the value the server knows was offered, not the client claim', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      incomingSuggestions: { governing_law: 'State of New York' },
      filledFields: { governing_law: 'Cayman Islands' },
      responses: { governing_law: { action: 'accepted' } },
    });
    expect(r.newContent.governing_law).toBe('State of New York');
  });

  it('falls back to the client value, then the current value, when nothing was offered', () => {
    expect(
      applyNegotiationRound({
        currentContent: base,
        filledFields: { governing_law: 'Texas' },
        responses: { governing_law: { action: 'accepted' } },
      }).newContent.governing_law,
    ).toBe('Texas');

    expect(
      applyNegotiationRound({
        currentContent: base,
        responses: { governing_law: { action: 'accepted' } },
      }).newContent.governing_law,
    ).toBe('Delaware');
  });

  it('reverts a rejected field and does not pass it on as a suggestion', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      incomingSuggestions: { governing_law: 'State of New York' },
      responses: { governing_law: { action: 'rejected' } },
    });
    expect(r.newContent.governing_law).toBe('Delaware');
    expect(r.outgoingSuggestions).toEqual({});
    expect(r.fullyAccepted).toBe(false);
  });

  it('reverts a rejected field even when the client also sent it as a filled value', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      filledFields: { governing_law: 'State of New York' },
      responses: { governing_law: { action: 'rejected' } },
    });
    expect(r.newContent.governing_law).toBe('Delaware');
    expect(r.appliedFilledFields.governing_law).toBeUndefined();
  });

  it('lets rejection beat a same-field fresh suggestion', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      suggestedChanges: { governing_law: 'Nevada' },
      responses: { governing_law: { action: 'rejected' } },
    });
    expect(r.outgoingSuggestions.governing_law).toBeUndefined();
  });

  it('keeps a counter out of the document but passes it on as a suggestion', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      incomingSuggestions: { governing_law: 'State of New York' },
      responses: { governing_law: { action: 'countered', counterValue: '  Nevada  ' } },
    });
    expect(r.newContent.governing_law).toBe('Delaware');
    expect(r.outgoingSuggestions).toEqual({ governing_law: 'Nevada' });
    expect(r.fullyAccepted).toBe(false);
  });

  it('treats an empty counter as a rejection end to end', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      responses: { governing_law: { action: 'countered', counterValue: '  ' } },
    });
    expect(r.newContent.governing_law).toBe('Delaware');
    expect(r.outgoingSuggestions).toEqual({});
    expect(r.summary.rejected).toEqual(['Governing Law']);
  });

  it('lets a fresh suggestion override a counter on the same field', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      suggestedChanges: { governing_law: 'Nevada' },
      responses: { governing_law: { action: 'countered', counterValue: 'Texas' } },
    });
    expect(r.outgoingSuggestions).toEqual({ governing_law: 'Nevada' });
  });

  it('excludes rejected and countered fields from appliedFilledFields', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      filledFields: { a: '1', b: '2', c: '3' },
      responses: {
        b: { action: 'rejected' },
        c: { action: 'countered', counterValue: 'x' },
      },
    });
    expect(r.appliedFilledFields).toEqual({ a: '1' });
  });

  it('separates fresh suggestions from open items on a counter-only round', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      responses: { governing_law: { action: 'countered', counterValue: 'Nevada' } },
    });
    expect(r.hasFreshSuggestions).toBe(false);
    expect(r.hasOpenItems).toBe(true);
    expect(r.fullyAccepted).toBe(false);
  });

  it('is fully accepted only when nothing is left for the other party', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      incomingSuggestions: { governing_law: 'Nevada' },
      responses: { governing_law: { action: 'accepted' } },
    });
    expect(r.hasOpenItems).toBe(false);
    expect(r.fullyAccepted).toBe(true);
    expect(r.newContent.governing_law).toBe('Nevada');
  });

  it('ignores blank fresh suggestions', () => {
    const r = applyNegotiationRound({
      currentContent: base,
      suggestedChanges: { governing_law: '   ', term: '' },
    });
    expect(r.hasFreshSuggestions).toBe(false);
    expect(r.outgoingSuggestions).toEqual({});
    expect(r.fullyAccepted).toBe(true);
  });
});

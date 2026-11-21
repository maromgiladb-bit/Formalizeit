import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNdaText } from './ndaText';
import { NDA_TEXT } from './ndaText.generated';
import { SAMPLE_DEAL } from './sampleDeal';

const templateSource = fs.readFileSync(
  path.resolve(__dirname, '../../../templates/professional_mutual_nda_v1.hbs'),
  'utf-8',
);

describe('landing NDA text', () => {
  const built = buildNdaText(templateSource, SAMPLE_DEAL);

  it('generated module matches the template (rerun scripts/generate-landing-nda-text.mjs if not)', () => {
    expect(NDA_TEXT).toEqual(built);
  });

  it('marks every sample value and keeps the legal text fixed', () => {
    const variables = built.blocks.flatMap((b) => b.segments.filter((s) => s.isVariable).map((s) => s.text));
    expect(variables).toContain(SAMPLE_DEAL.partyA.name);
    expect(variables).toContain(SAMPLE_DEAL.purpose);
    expect(variables).toContain(SAMPLE_DEAL.governingLaw);
    expect(built.blocks[0]).toMatchObject({ kind: 'title' });
    expect(built.counts.sections).toBe(16);
    expect(built.counts.legalWords).toBeGreaterThan(1500);
    // No markers or tags leak into the text.
    const all = built.blocks.flatMap((b) => b.segments.map((s) => s.text)).join(' ');
    expect(all).not.toMatch(/[\u0001-\u0006<>]/);
  });
});

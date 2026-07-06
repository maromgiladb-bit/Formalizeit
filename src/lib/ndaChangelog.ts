import { getLatestTemplate } from './templateManager';

/**
 * Human-readable changelog for the standard NDA. This is the single source of
 * truth for BOTH the public `/nda-changelog` page and the in-app "review the
 * updated NDA" popup (shown on first sign-in after the standard NDA's version
 * is bumped). Keep it in sync with `templates/template-config.json` (the shipped
 * version) and `templates/CHANGELOG.md` whenever the standard NDA changes.
 *
 * Entries are ordered newest-first. `summary` is a one-line description; the
 * bullet arrays call out specific clause/field changes in plain language.
 */

export const STANDARD_NDA_TEMPLATE_ID = 'professional_mutual_nda_v1';

export interface NdaChangelogEntry {
  version: string; // e.g. "1.0", "1.1", "2.0"
  date: string; // ISO date "YYYY-MM-DD"
  summary: string;
  added?: string[];
  changed?: string[];
  removed?: string[];
}

export const NDA_CHANGELOG: NdaChangelogEntry[] = [
  {
    version: '1.0',
    date: '2025-11-10',
    summary: 'Initial release of the standard mutual NDA.',
    added: [
      'Mutual confidentiality obligations for both parties',
      'Definition of and exclusions from confidential information',
      'Term, return-of-materials, and post-termination survival clauses',
      'Governing law, notices, and dual signature blocks',
    ],
  },
];

/** The earliest tracked version — used as the baseline for users who have never acknowledged one. */
export const EARLIEST_NDA_VERSION = NDA_CHANGELOG[NDA_CHANGELOG.length - 1]?.version ?? '1.0';

function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.').map((p) => parseInt(p, 10) || 0);
  return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
}

/** Returns > 0 if a > b, < 0 if a < b, 0 if equal. */
export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  return va.major - vb.major || va.minor - vb.minor || va.patch - vb.patch;
}

/** The version of the standard NDA currently shipped (from the bundled template config). */
export function getCurrentStandardNdaVersion(): string {
  const latest = getLatestTemplate(STANDARD_NDA_TEMPLATE_ID);
  return latest?.version ?? EARLIEST_NDA_VERSION;
}

/**
 * Changelog entries newer than the given acknowledged version. A null/undefined
 * acknowledged version is treated as the baseline (earliest tracked), so brand
 * new and pre-feature users are considered current until the next real bump.
 */
export function getChangelogSince(acknowledgedVersion: string | null | undefined): NdaChangelogEntry[] {
  const baseline = acknowledgedVersion ?? EARLIEST_NDA_VERSION;
  return NDA_CHANGELOG.filter((entry) => compareVersions(entry.version, baseline) > 0);
}

/**
 * Whether the "review the updated NDA" popup should be shown: there is at least
 * one changelog entry newer than what the user last acknowledged.
 */
export function shouldPromptNdaReview(acknowledgedVersion: string | null | undefined): boolean {
  return getChangelogSince(acknowledgedVersion).length > 0;
}

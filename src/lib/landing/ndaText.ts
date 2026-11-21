/**
 * Turns the real standard NDA template (templates/professional_mutual_nda_v1.hbs) into plain,
 * structured text for the landing page: every variable value is marked, so a scene can show the
 * fixed legal text and the few blanks a user fills, and the counts are computed, not guessed.
 *
 * Server-safe and pure (no fs). Two ways in:
 * - Pages and scenes import the precomputed result from `./ndaText.generated` (no Handlebars and
 *   no 34 KB template in the client bundle). Regenerate it with
 *   `node scripts/generate-landing-nda-text.mjs` after the template or the sample deal changes;
 *   `ndaText.test.ts` fails when the generated file is stale.
 * - Server code may call `buildNdaText(templateSource, values)` directly.
 *
 * Imports are limited to `handlebars` and type-only imports so the generator script can load this
 * file with Node's built-in type stripping.
 */
import Handlebars from 'handlebars';
import type { SampleParty } from './sampleDeal';

export interface NdaSegment {
  text: string;
  isVariable: boolean;
  /** Template data key for variable segments (e.g. "party_1_name"). */
  key?: string;
}

export type NdaBlockKind = 'title' | 'heading' | 'text';

export interface NdaBlock {
  kind: NdaBlockKind;
  segments: NdaSegment[];
}

export interface NdaTextCounts {
  /** Words of fixed text (everything that is not a variable value), headings included. */
  legalWords: number;
  /** Words inside variable values for the sample deal. */
  variableWords: number;
  /** Distinct form fields the user fills that appear in the document. */
  variableFields: number;
  /** Of those, the required ones (excludes phones and the optional additional clause). */
  requiredVariableFields: number;
  /** Places in the document where a variable value is printed. */
  variableSpots: number;
  /** Numbered sections. */
  sections: number;
}

export interface NdaText {
  blocks: NdaBlock[];
  counts: NdaTextCounts;
  /** Labels of the form fields counted in `counts.variableFields`, in document order. */
  variableFieldLabels: string[];
}

/** Values for the template, in the shape the sample deal provides. */
export interface NdaTemplateValues {
  partyA: SampleParty;
  partyB: SampleParty;
  purpose: string;
  effectiveDate: string;
  termYears: number;
  termYearsWords: string;
  governingLaw: string;
  additionalTerms: string;
}

/**
 * Template key -> the fill-form field a user types it into. `null` = set by the app, not the user
 * (information_scope_text is a fixed default in the fill page), so it counts as fixed text.
 */
const KEY_TO_FIELD: Readonly<Record<string, { label: string; optional?: boolean } | null>> = {
  effective_date_long: { label: 'Effective date' },
  party_1_name: { label: 'Party A name' },
  party_1_address: { label: 'Party A address' },
  party_1_phone: { label: 'Party A phone', optional: true },
  party_1_emails_joined: { label: 'Party A email' },
  party_1_signatory_name: { label: 'Party A signatory' },
  party_1_signatory_title: { label: 'Party A signatory title' },
  party_2_name: { label: 'Party B name' },
  party_2_address: { label: 'Party B address' },
  party_2_phone: { label: 'Party B phone', optional: true },
  party_2_emails_joined: { label: 'Party B email' },
  party_2_signatory_name: { label: 'Party B signatory' },
  party_2_signatory_title: { label: 'Party B signatory title' },
  purpose: { label: 'Purpose' },
  governing_law_full: { label: 'Governing law' },
  // term_years_number and term_years_words both come from the one "Term" input.
  term_years_number: { label: 'Term' },
  term_years_words: { label: 'Term' },
  additional_terms: { label: 'Additional clauses', optional: true },
  information_scope_text: null,
};

/** The fill page's fixed default for information_scope_text (src/app/fillndahtml/page.tsx). */
const INFORMATION_SCOPE_DEFAULT = 'All information, materials, documents, data, and other content';

const OPEN = '\u0001';
const MID = '\u0002';
const CLOSE = '\u0003';
const HEAD = '\u0005';
const BREAK = '\u0006';

function mark(key: string, value: string): string {
  return `${OPEN}${key}${MID}${value}${CLOSE}`;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function countWords(s: string): number {
  return s.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length;
}

export function buildNdaText(templateSource: string, v: NdaTemplateValues): NdaText {
  const hbs = Handlebars.create();
  // Same contract as the app's helper (src/lib/renderNdaHtml.ts): value, or "[label]" when empty.
  hbs.registerHelper('ph', (value: unknown, label: string) => {
    const s = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
    return s ? s : `[${label}]`;
  });

  const raw: Record<string, string> = {
    effective_date_long: v.effectiveDate,
    party_1_name: v.partyA.name,
    party_1_address: v.partyA.address,
    party_1_phone: v.partyA.phone,
    party_1_emails_joined: v.partyA.email,
    party_1_signatory_name: v.partyA.signatoryName,
    party_1_signatory_title: v.partyA.signatoryTitle,
    party_2_name: v.partyB.name,
    party_2_address: v.partyB.address,
    party_2_phone: v.partyB.phone,
    party_2_emails_joined: v.partyB.email,
    party_2_signatory_name: v.partyB.signatoryName,
    party_2_signatory_title: v.partyB.signatoryTitle,
    purpose: v.purpose,
    governing_law_full: v.governingLaw,
    term_years_number: String(v.termYears),
    term_years_words: v.termYearsWords,
    additional_terms: v.additionalTerms,
  };
  const data: Record<string, unknown> = {
    doc_title: 'Mutual Confidentiality and Non-Disclosure Agreement',
    information_scope_text: INFORMATION_SCOPE_DEFAULT,
    partyASignature: {},
    partyBSignature: {},
  };
  for (const [key, value] of Object.entries(raw)) data[key] = mark(key, value);

  const html = hbs.compile(templateSource)(data);
  const bodyStart = html.indexOf('<body');
  const scriptStart = html.indexOf('<script', bodyStart);
  let body = html.slice(bodyStart, scriptStart === -1 ? undefined : scriptStart);

  body = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<h1\b[^>]*>/gi, `${BREAK}${HEAD}title${HEAD}`)
    .replace(/<h2\b[^>]*>/gi, `${BREAK}${HEAD}heading${HEAD}`)
    .replace(/<\/?(?:h1|h2|p|div|tr|br|hr|table|thead|tbody|th|td)\b[^>]*>/gi, BREAK)
    .replace(/<[^>]+>/g, '')
    // Line breaks in the template source inside a paragraph are only formatting.
    .replace(/\s+/g, ' ');
  body = decodeEntities(body);

  const blocks: NdaBlock[] = [];
  const headRe = new RegExp(`^${HEAD}(title|heading)${HEAD}`);
  const varRe = new RegExp(`${OPEN}([^${MID}]*)${MID}([^${CLOSE}]*)${CLOSE}`, 'g');

  for (const rawLine of body.split(BREAK)) {
    let line = rawLine.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    let kind: NdaBlockKind = 'text';
    const head = headRe.exec(line);
    if (head) {
      kind = head[1] as NdaBlockKind;
      line = line.slice(head[0].length).trim();
    }
    // The empty signature box placeholder is not agreement text.
    if (!line || line === 'sign here') continue;

    const segments: NdaSegment[] = [];
    let last = 0;
    for (const m of line.matchAll(varRe)) {
      const idx = m.index ?? 0;
      if (idx > last) segments.push({ text: line.slice(last, idx), isVariable: false });
      if (m[2]) segments.push({ text: m[2], isVariable: true, key: m[1] });
      last = idx + m[0].length;
    }
    if (last < line.length) segments.push({ text: line.slice(last), isVariable: false });
    // Labels with an empty value ("Phone:") keep their fixed text; drop lines that end up empty.
    const cleaned = segments.filter((s) => s.text.trim().length > 0 || s.isVariable);
    if (cleaned.length > 0) blocks.push({ kind, segments: cleaned });
  }

  let legalWords = 0;
  let variableWords = 0;
  let variableSpots = 0;
  const labels: string[] = [];
  const required = new Set<string>();
  for (const block of blocks) {
    for (const seg of block.segments) {
      if (!seg.isVariable) {
        legalWords += countWords(seg.text);
        continue;
      }
      variableSpots += 1;
      variableWords += countWords(seg.text);
      const field = seg.key ? KEY_TO_FIELD[seg.key] : undefined;
      if (field && !labels.includes(field.label)) labels.push(field.label);
      if (field && !field.optional) required.add(field.label);
    }
  }
  // Fields whose sample value is empty (phones) print nothing but are still fields the user fills.
  for (const key of Object.keys(raw)) {
    const field = KEY_TO_FIELD[key];
    if (field && templateSource.includes(key) && !labels.includes(field.label)) labels.push(field.label);
  }

  return {
    blocks,
    counts: {
      legalWords,
      variableWords,
      variableFields: labels.length,
      requiredVariableFields: required.size,
      variableSpots,
      sections: blocks.filter((b) => b.kind === 'heading').length,
    },
    variableFieldLabels: labels,
  };
}

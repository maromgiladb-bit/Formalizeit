/**
 * Fictional demo deal for the landing page scenes and copy. Single source of truth: it mirrors
 * section 4 "Demo script" of docs/superpowers/specs/2026-11-21-landing-copy.md. Every value is
 * fictional (`.example` is a reserved domain, 203.0.113.0/24 is a documentation IP range).
 *
 * Dependency-free on purpose: scripts/generate-landing-nda-text.mjs imports this file directly
 * with Node's type stripping, so it must not import anything (type-only imports are fine).
 */

export type StatusTone = 'neutral' | 'progress' | 'action' | 'done';

export interface SampleParty {
  name: string;
  address: string;
  phone: string;
  email: string;
  signatoryName: string;
  signatoryTitle: string;
}

export const SAMPLE_DEAL = {
  title: 'Northwind Robotics x Halden Bio NDA',
  partyA: {
    name: 'Northwind Robotics',
    address: '410 Harbor Street, Rotterdam',
    phone: '',
    email: 'dana@northwindrobotics.example',
    signatoryName: 'Dana Whitfield',
    signatoryTitle: 'Head of Partnerships',
  } satisfies SampleParty,
  partyB: {
    name: 'Halden Bio',
    address: '22 Quay Road, Dublin',
    phone: '',
    email: 'ola@haldenbio.example',
    signatoryName: 'Ola Brandt',
    signatoryTitle: 'COO',
  } satisfies SampleParty,
  /** As typed in the form. The template inserts it mid-sentence ("in furtherance of ..."). */
  purpose: 'evaluating a joint pilot for lab automation',
  /** effective_date_long, as the app formats it (en-US long). */
  effectiveDate: 'July 12, 2026',
  effectiveDateIso: '2026-07-12',
  termYears: 2,
  termYearsWords: 'two',
  termLabel: '2 years',
  /** governing_law_full; the template reads "the laws of the State of {value}". */
  governingLaw: 'Delaware',
  /** The one optional open clause. The sample leaves it at a short neutral value. */
  additionalTerms: 'None.',
  templateVersion: '1.0',
  templateName: 'Standard Mutual NDA',
} as const;

/** The order fields type in during the fill animation (copy deck). One entry per visible field. */
export const FILL_ORDER = [
  { id: 'partyA', label: 'Party A', value: SAMPLE_DEAL.partyA.name },
  { id: 'partyB', label: 'Party B', value: SAMPLE_DEAL.partyB.name },
  { id: 'purpose', label: 'Purpose', value: SAMPLE_DEAL.purpose },
  { id: 'effectiveDate', label: 'Effective date', value: SAMPLE_DEAL.effectiveDate },
  { id: 'term', label: 'Term', value: SAMPLE_DEAL.termLabel },
  { id: 'governingLaw', label: 'Governing law', value: `State of ${SAMPLE_DEAL.governingLaw}` },
] as const;

export type FillFieldId = (typeof FILL_ORDER)[number]['id'];

/** Template variable key -> the fill step that supplies it (1-based, matches FILL_ORDER). */
export const TEMPLATE_KEY_FILL_STEP: Readonly<Record<string, number>> = {
  party_1_name: 1,
  party_1_address: 1,
  party_2_name: 2,
  party_2_address: 2,
  purpose: 3,
  effective_date_long: 4,
  term_years_number: 5,
  term_years_words: 5,
  governing_law_full: 6,
};

/** Share message, exactly as send-for-review builds it (link shortened for display). */
export const SAMPLE_SHARE = {
  link: 'formalizeit.com/fillndahtml-public/...',
  subject: `${SAMPLE_DEAL.partyA.name} sent you an NDA to review — ${SAMPLE_DEAL.title}`,
  body: [
    'Hi,',
    '',
    `${SAMPLE_DEAL.partyA.name} has sent you a Non-Disclosure Agreement to review and sign.`,
    '',
    'You can open and review the document here:',
    'formalizeit.com/fillndahtml-public/...',
    '',
    'The link stays active while the NDA is in progress and expires after 14 days of inactivity. No account is needed.',
    '',
    'Best regards,',
    SAMPLE_DEAL.partyA.name,
  ].join('\n'),
  /** Optional sender note, shown above "Best regards" only when the sender adds one. */
  note: `Note from ${SAMPLE_DEAL.partyA.name}: Happy to start whenever you're ready.`,
  recipientName: SAMPLE_DEAL.partyB.name,
} as const;

/** Signature evidence for the executed sample. Shown with a "Sample" caption by the page. */
export const SAMPLE_EVIDENCE = {
  signerEmail: SAMPLE_DEAL.partyB.email,
  signerName: SAMPLE_DEAL.partyB.signatoryName,
  signedAt: '2026-07-14T09:32:00Z',
  signedAtLabel: '2026-07-14 09:32 UTC',
  ipAddress: '203.0.113.24',
  templateVersion: SAMPLE_DEAL.templateVersion,
  versionLabel: `${SAMPLE_DEAL.templateName} v${SAMPLE_DEAL.templateVersion}`,
  /** Always shown shortened; never a full fake hash. */
  hashShort: '9f2c4e1a...b7d03a',
  authorityLine: `Confirmed: authorized to sign for ${SAMPLE_DEAL.partyB.name}`,
} as const;

/** Workflow labels as getWorkflowStatusInfo() returns them (sender view unless noted). */
export const SAMPLE_STATUS = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'progress' },
  waiting: { label: 'Waiting on them', tone: 'progress' },
  complete: { label: 'Complete', tone: 'done' },
  signed: { label: 'Signed', tone: 'done' },
  receiverReview: { label: 'Your turn: review', tone: 'action' },
  receiverSign: { label: 'Your turn: sign', tone: 'action' },
} as const satisfies Record<string, { label: string; tone: StatusTone }>;

/** Mockup-only toast (not an app label) for the 48-hour reminder beat. */
export const SAMPLE_REMINDER_TOAST = `Reminder sent to ${SAMPLE_DEAL.partyB.name}`;

/** "One text, many deals" fan-out rows (copy deck section 2.3). */
export const FAN_OUT_DEALS = [
  { party: 'Halden Bio', date: 'Jul 12, 2026' },
  { party: 'Globex GmbH', date: 'Aug 3, 2026' },
  { party: 'Initech Ltd.', date: 'Sep 9, 2026' },
] as const;

/** The old way, in order (storytelling, never a stat). `fromRight` alternates the thread sides. */
export const OLD_WAY_ITEMS = [
  { label: 'NDA_final_v1.docx', fromRight: false },
  { label: 'redline v3 attached', fromRight: true },
  { label: 'just one small change...', fromRight: false },
  { label: 'waiting on legal review', fromRight: true },
  { label: '11 days later...', fromRight: false },
] as const;

/** Team members for the roles scene (initials avatars only). */
export const SAMPLE_TEAM = [
  {
    role: 'administrator',
    roleLabel: 'Administrator',
    name: 'Dana Whitfield',
    email: 'dana@northwindrobotics.example',
    canSign: true,
    does: 'Manages the workspace and members. Can also be a signer.',
  },
  {
    role: 'signer',
    roleLabel: 'Signer',
    name: 'Ravi Menon',
    email: 'ravi@northwindrobotics.example',
    canSign: true,
    does: 'Drafts, edits and sends, and signs for the company.',
  },
  {
    role: 'contributor',
    roleLabel: 'Contributor',
    name: 'Lena Ortiz',
    email: 'lena@northwindrobotics.example',
    canSign: false,
    does: 'Drafts, edits and sends. Everything except signing.',
  },
] as const;

export type TeamRole = (typeof SAMPLE_TEAM)[number]['role'];

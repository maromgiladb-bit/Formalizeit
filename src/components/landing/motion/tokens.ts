/*
 * Landing motion vocabulary. One set of curves and durations for every primitive in this folder,
 * so the page moves as one system. Values are milliseconds unless the name ends in `_S`.
 *
 * Curves
 * - out    cubic-bezier(0.2, 0.8, 0.2, 1)  The Ink & Seal house curve (share sheet, stitch-design
 *          "Motion"). Starts fast, settles long: used for everything that enters (reveals, lines,
 *          stamp, crossfades). Calm rather than punchy, which suits a legal product.
 * - snap   cubic-bezier(0.23, 1, 0.32, 1)  Emil Kowalski's strong ease-out. Only for direct
 *          feedback (press), where the first frames must move immediately.
 * - inOut  cubic-bezier(0.77, 0, 0.175, 1) For things that move on screen between two resting
 *          states (digits rolling, a scene travelling). Never used for entrances.
 * There is deliberately no ease-in: it delays the frames the eye is watching.
 *
 * Durations
 * - press  150  button press feedback (Emil: 100 to 160)
 * - state  220  small state changes and the seal stamp (stitch-design: seal 220ms)
 * - sheet  280  crossfades, scroll-story step changes, digit rolls (stitch-design: share sheet 280ms)
 * - reveal 450  marketing reveals: a heading line or block rising into place. Longer is allowed
 *          for explanatory marketing motion; longer than this starts to feel like waiting.
 */

export type CubicBezier = readonly [number, number, number, number];

export const EASE = {
  out: [0.2, 0.8, 0.2, 1],
  snap: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
} as const satisfies Record<string, CubicBezier>;

export type EaseName = keyof typeof EASE;

function toCss(b: CubicBezier): string {
  return `cubic-bezier(${b[0]}, ${b[1]}, ${b[2]}, ${b[3]})`;
}

/** The same curves as CSS strings, for inline styles and the injected stylesheet. */
export const CSS_EASE: Record<EaseName, string> = {
  out: toCss(EASE.out),
  snap: toCss(EASE.snap),
  inOut: toCss(EASE.inOut),
};

export const DUR = {
  press: 150,
  state: 220,
  sheet: 280,
  reveal: 450,
} as const;

export type DurName = keyof typeof DUR;

/** Durations in seconds, for framer-motion transitions. */
export const DUR_S: Record<DurName, number> = {
  press: DUR.press / 1000,
  state: DUR.state / 1000,
  sheet: DUR.sheet / 1000,
  reveal: DUR.reveal / 1000,
};

/**
 * Stagger steps. Kept short (Emil: 30 to 80ms) so a group reads as one gesture, never as a queue.
 * - digit 40  between columns of a rolling number
 * - item  60  between small items inside one element (stitch-design: blanks fill 60ms)
 * - block 80  between blocks, lines of a heading (matches the site Reveal stagger)
 */
export const STAGGER = {
  digit: 40,
  item: 60,
  block: 80,
} as const;

/** Distance a block rises when it reveals. Matches the site-wide Reveal (24px). */
export const RISE_PX = 24;

/** Scale the seal starts from (stitch-design: 1.15 to 1). */
export const STAMP_FROM_SCALE = 1.15;

/**
 * If hydration has not armed a hidden element this long after it was painted, CSS shows it anyway
 * (see motion-styles.tsx). Protects content when JavaScript is slow or fails after `html.js` is set.
 */
export const FAILSAFE_MS = 1800;

/** Hero load sequences should finish inside this budget (last delay + its duration). */
export const HERO_BUDGET_MS = 1200;

/**
 * Press feel for large CTAs that are links or custom elements. Buttons already get a 1px press from
 * globals.css; this adds Emil's subtle scale, which uses the separate `scale` property in Tailwind v4,
 * so it composes with that translate instead of fighting it.
 */
export const PRESSABLE =
  'transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100';

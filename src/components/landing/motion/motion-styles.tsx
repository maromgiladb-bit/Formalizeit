import { CSS_EASE, DUR, FAILSAFE_MS, RISE_PX, STAMP_FROM_SCALE } from './tokens';

/*
 * The stylesheet behind every landing motion primitive. Rendered as a React 19 hoisted <style>
 * (same `href` = one copy in <head>), so it ships in the server HTML and applies before first paint.
 *
 * Protocol
 * - A host carries `data-lm-trigger` = load | view | manual, and (after hydration) `data-lm-state`
 *   = armed | in. Animated children carry `data-lm-t` = rise | fade | line | stamp and may set
 *   `--lm-delay` on themselves.
 * - Server HTML / no JavaScript: no rule hides anything; every target is in its final state.
 * - `html.js` (set before paint by the root layout) hides view/manual targets until their host is
 *   `in`. If hydration has not armed the host within FAILSAFE_MS, a CSS animation shows it anyway.
 * - `load` hosts never need JavaScript: a CSS animation plays from first paint, off the main thread.
 * - prefers-reduced-motion: every target is pinned to its final state, nothing moves.
 * Do not nest hosts; an outer host that is not yet `in` would also hide the inner host's targets.
 */

const rise = `opacity: 0; transform: translate3d(0, ${RISE_PX}px, 0);`;
const line = 'transform: translate3d(0, 105%, 0);';
const fade = 'opacity: 0;';
const stamp = `opacity: 0; transform: scale(${STAMP_FROM_SCALE});`;

const hiddenHost = '.js [data-lm-trigger="view"]:not([data-lm-state="in"]), .js [data-lm-trigger="manual"]:not([data-lm-state="in"])';
function hidden(kind: string): string {
  return hiddenHost
    .split(', ')
    .map((h) => `${h} [data-lm-t="${kind}"]`)
    .join(',\n');
}

const MOTION_CSS = `
@keyframes lm-rise { from { ${rise} } }
@keyframes lm-line { from { ${line} } }
@keyframes lm-fade { from { ${fade} } }
@keyframes lm-stamp { from { ${stamp} } }
@keyframes lm-failsafe { to { opacity: 1; transform: none; } }

[data-lm-mask] { display: block; overflow: hidden; padding-bottom: 0.12em; margin-bottom: -0.12em; }
[data-lm-t="line"] { display: block; }
[data-lm-t="stamp"] { display: inline-block; }
/* An inline item (SeqItem as="span") must be a box, or its rise transform does nothing. */
span[data-lm-t]:not([data-lm-t="line"]) { display: inline-block; }

.js [data-lm-trigger="load"] [data-lm-t="rise"] { animation: lm-rise ${DUR.reveal}ms ${CSS_EASE.out} var(--lm-delay, 0ms) both; }
.js [data-lm-trigger="load"] [data-lm-t="line"] { animation: lm-line ${DUR.reveal}ms ${CSS_EASE.out} var(--lm-delay, 0ms) both; }
.js [data-lm-trigger="load"] [data-lm-t="fade"] { animation: lm-fade ${DUR.reveal}ms ${CSS_EASE.out} var(--lm-delay, 0ms) both; }
.js [data-lm-trigger="load"] [data-lm-t="stamp"] { animation: lm-stamp ${DUR.state}ms ${CSS_EASE.out} var(--lm-delay, 0ms) both; }

[data-lm-trigger="view"] [data-lm-t],
[data-lm-trigger="manual"] [data-lm-t] {
  transition: opacity ${DUR.reveal}ms ${CSS_EASE.out}, transform ${DUR.reveal}ms ${CSS_EASE.out};
  transition-delay: var(--lm-delay, 0ms);
}
[data-lm-trigger="view"] [data-lm-t="stamp"],
[data-lm-trigger="manual"] [data-lm-t="stamp"] {
  transition-duration: ${DUR.state}ms;
}

${hidden('rise')} { ${rise} }
${hidden('line')} { ${line} }
${hidden('fade')} { ${fade} }
${hidden('stamp')} { ${stamp} }

/* Leaving (a manual host going back): fast and all at once. Entering keeps its stagger. */
.js [data-lm-trigger="manual"][data-lm-state="armed"] [data-lm-t] {
  transition-duration: ${DUR.press}ms;
  transition-delay: 0ms;
}

/* Failsafe: never leave content hidden because hydration is slow. */
.js [data-lm-trigger="view"]:not([data-lm-state]) [data-lm-t],
.js [data-lm-trigger="manual"]:not([data-lm-state]) [data-lm-t] {
  animation: lm-failsafe 1ms linear ${FAILSAFE_MS}ms forwards;
}

/* Scroll story: stacked by default; pinned only for scripted, wide, motion-OK viewports. */
.lm-story-steps { list-style: none; margin: 0; padding: 0; }
.lm-story-pin { display: none; }
@media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
  .js .lm-story { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 4rem; }
  .js .lm-story[data-side="left"] .lm-story-pin { order: -1; }
  .js .lm-story-pin { display: block; }
  .js .lm-story-pin-inner {
    position: sticky;
    top: var(--lm-story-top, 7rem);
    display: grid;
    align-items: start;
    min-height: calc(100svh - var(--lm-story-top, 7rem) - 2rem);
  }
  .js .lm-story-visual {
    grid-area: 1 / 1;
    opacity: 0;
    transform: translate3d(0, 12px, 0) scale(0.985);
    transition: opacity ${DUR.press}ms ${CSS_EASE.out}, transform ${DUR.press}ms ${CSS_EASE.out};
    pointer-events: none;
  }
  .js .lm-story-visual[data-past] { transform: translate3d(0, -8px, 0) scale(0.985); }
  .js .lm-story-visual[data-active] {
    opacity: 1;
    transform: none;
    transition-duration: ${DUR.sheet}ms;
    transition-delay: 100ms;
    pointer-events: auto;
  }
  .js .lm-story-inline { display: none; }
  .js .lm-story [data-lm-step] { min-height: 72vh; padding-bottom: 8vh; }
  /* The last step is a full pinned screen tall, so the final visual (the seal) holds while it lands. */
  .js .lm-story [data-lm-step]:last-child { min-height: calc(100svh - var(--lm-story-top, 7rem)); padding-bottom: 0; }
  .js .lm-story [data-lm-step] .lm-story-text { transition: opacity ${DUR.sheet}ms ${CSS_EASE.out}; }
  .js .lm-story [data-lm-step]:not([data-active]) .lm-story-text { opacity: 0.45; }
}

@media (prefers-reduced-motion: reduce) {
  [data-lm-t] { animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important; }
  [data-lm-roll] { transition: none !important; }
  [data-lm-wall-lit] { display: none !important; }
}
`;

/** Injects the motion stylesheet once. Every primitive renders it; React dedupes by href. */
export function MotionStyles() {
  return (
    <style href="formalizeit-landing-motion" precedence="default">
      {MOTION_CSS}
    </style>
  );
}

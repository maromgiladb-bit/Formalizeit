# Landing motion kit

Import from `@/components/landing/motion`. Client components; usable from server pages except
`ScrollStory` and `WallDim`, which take render functions (call them from a client section).

## Shared rules

- **Server / no-JS = final state.** Nothing hides without `html.js`. View/manual targets hide under
  `html.js` until hydration arms them; if that has not happened after `FAILSAFE_MS` (1800ms), CSS
  shows them anyway. `load` sequences are pure CSS from first paint (no hydration needed).
- **Reduced motion:** every target is pinned to its final state, no movement (CSS `!important`);
  the scroll story stays stacked; the wall stays dim; digits do not roll.
- Only `transform`, `opacity` (and `clip` via `overflow`). No `transition: all`. No per-frame
  React renders: scroll values go through framer motion values or direct style writes.
- The CSS lives in `motion-styles.tsx` and is injected once as a hoisted React 19 `<style>`.
- Do not nest a gated host (Sequence, LineReveal, StampIn, Counter/Clock with `from`) inside another.

## Tokens (`tokens.ts`)

| Name | Value | Use |
|---|---|---|
| `EASE.out` | `cubic-bezier(0.2,0.8,0.2,1)` | house curve; all entrances |
| `EASE.snap` | `cubic-bezier(0.23,1,0.32,1)` | press feedback |
| `EASE.inOut` | `cubic-bezier(0.77,0,0.175,1)` | on-screen moves (digit rolls) |
| `DUR` | press 150, state 220, sheet 280, reveal 450 (ms); `DUR_S` in seconds |
| `STAGGER` | digit 40, item 60, block 80 (ms) |
| `RISE_PX` 24, `STAMP_FROM_SCALE` 1.15, `FAILSAFE_MS` 1800, `HERO_BUDGET_MS` 1200 |
| `PRESSABLE` | Tailwind classes: `active:scale-[0.98]`, 150ms snap, off under reduced motion. Buttons already get a 1px press globally; use this on big CTA links. |

## Primitives

**`Sequence` / `SeqItem`** (all directions). Choreographed group.
`Sequence { trigger: 'load'|'view'|'manual' = 'view', active?, stagger = 80, as, className, margin }`.
`SeqItem { kind: 'rise'|'fade'|'stamp' = 'rise', order = 0, delayMs?, as, className, style }`.
rise = opacity 0 + 24px to rest, 450ms `EASE.out`; fade = opacity, 450ms; stamp = opacity + scale
1.15 to 1, 220ms. Delay = `order x stagger`. `manual` follows `active` both ways; leaving is 150ms
with no stagger (fast exit).

**Hero choreography (pattern).** `<Sequence trigger="load">`. Keep the h1 and primary CTA *outside*
any SeqItem, so they are readable and clickable at first paint. Supporting pieces: subline order 1,
secondary CTA order 2. Last delay + duration must stay under 1200ms (e.g. 320 + 450 = 770ms).
A `SeqItem as="span"` is made inline-block so its rise transform applies.

**`HeroStage`** (A and C hero visuals). `{ last, intervalMs, startDelayMs, revealDelayMs, className,
children(index | null) }`. A product sequence above the fold that never shows final-then-empty:
server and no-JS render the final state (`index` null); under `html.js` the visual is hidden until
hydration, which sets index 0 while still hidden, then rises in (450ms `EASE.out`) at its start and
plays once. If hydration is later than the 1800ms CSS failsafe, the final state is already showing
and stays, static. Reduced motion: final state at once.

**`LineReveal`** (B, also A/C section heads). `{ lines: ReactNode[], as = 'h2', trigger: 'view'|'load',
delayMs = 0, stagger = 80, className, lineClassName, margin }`. Each line rises out of its own mask,
translateY 105% to 0, 450ms `EASE.out`, 80ms apart. Real text, one heading for screen readers.
Not for the hero h1.

**`StampIn`** (A seal moment; usable in B/C evidence). `{ children, trigger = 'view', active?, delayMs, className }`.
Wrap `<Seal />` without its own `animate`. Scale 1.15 to 1 + opacity, 220ms `EASE.out`. Evidence
lines that follow: a Sequence with a stamp item and rise items at `delayMs` 160/220/280.

**`Counter`** (B real word/variable counts). `{ value: number, rollIn = true, format, label, className }`.
Odometer roll from zeros on first view: 800ms per column (marketing pace), `EASE.inOut`, 60ms column
stagger, fades in. Proportional figures, so separators sit as in plain text. Real numbers only.

**`Clock`** (C). `{ time: 'HH:MM', from?, label?, className, durationMs = 280, instant? }`. Controlled:
change `time` and the digits roll (`EASE.inOut`, 40ms stagger; use 160ms when scroll drives it minute
by minute). `instant` jumps without rolling (resetting a sequence). With `from`, rolls from it on
first view. Each digit column is its own 1em clip window and strip rows are 1.4em, so rolling
digits never show above or below the line. The colon is pulled in (-0.14em each side) because mono gives it a full digit cell.
Visible digits are `aria-hidden`; one stable sr-only label, no live region. Label times as an example.

**`RollingValue`**: the engine under Counter and Clock, for any digit string.

**`ScrollStory`** (A). `{ steps: {id, content}[], renderVisual(step, {pinned, active, progress}),
visualSide = 'right', stickyTop = '7rem', className, stepClassName, inlineVisualClassName, onStepChange }`.
At >=1024px with JS and motion OK: text steps top-aligned right under the heading; the visual column
sticks at `stickyTop`; active step = the one crossing a line 40% down the viewport; inactive text at
45% (280ms). All pinned visuals share one grid cell (no height change); a change is one move: the old
visual leaves in 150ms (fade, 8px up), the new one settles in 280ms after a 100ms beat (fade, 12px
rise, 0.985 to 1). `active` is true only for the current step while the story is on screen: start
autoplay and stamps on it. The last step is a full pinned screen tall so the final visual holds.
Mobile, no-JS, reduced motion: stacked, each step followed by its static visual (CSS-only switch).

**`WallDim`** (B). `{ children(mode: 'dim'|'lit'), litClassName = 'bg-white', className, offset }`.
Two identical-layout renders; the ink copy on top fades 1 to 0 linearly with scroll (wall top from
80% to 25% of viewport), leaving dim text with lit variables. Server/no-JS/reduced: dim only.

## Hooks

- `useScrollStep(ref, count, offset = ['start center','end center'])` returns `{ step, progress }`;
  re-renders only when the step changes; step is the last one before mount (final state).
- `useInViewOnce(ref, margin)`: boolean, never flips back.
- `usePlayOnce(last, { enabled, intervalMs, startDelayMs })`: plays 0..last once and rests; null
  before it starts (render the final state). Index 0 is set at once and holds `startDelayMs +
  intervalMs`. Never loops, so no pause control is needed. Only start it on content that is hidden
  or off screen (HeroStage, pinned story steps). Scene `autoplay` props use it.
- `failsafeFired(el)`: true if the CSS failsafe already revealed `el` (hydration was late).
- `useMotionGate({ trigger, active, margin, enabled })` + `gateAttrs()`: build a new gated primitive.
- `prefersReducedMotion()`: synchronous read for effects.

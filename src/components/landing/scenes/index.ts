/**
 * Landing page product scenes: faithful, code-built renders of the real product UI.
 *
 * Contract: client components; the default render is the final, complete state (no-JS and reduced
 * motion look right); a controlled prop drives intermediate states; transitions use only
 * transform / opacity / color / background-color (border-color for field focus), each with
 * motion-reduce:transition-none. No scroll logic. No timers unless `autoplay` (off under reduced
 * motion). Each scene is one <figure role="img" aria-label> with an `inert` inner, so mock
 * buttons never take focus. All accept `className` and `label` (aria-label override).
 * Sample data: src/lib/landing/sampleDeal.ts. Real NDA text and counts: src/lib/landing/ndaText.ts
 * (precomputed into ndaText.generated.ts by scripts/generate-landing-nda-text.mjs).
 *
 * DocumentScene
 *   variant="excerpt" (default)  filled 0..6 (default 6), autoplay
 *   variant="wall"               dim 0..1 (default 1), fontSize px (default 9), showMeta (default true)
 * FillScene       autoplay: four fields type in once, char by char (final state: all filled)
 * ShareScene      step 0 card | 1 link copied (default 1), autoplay
 * SignScene       autoplay: box ticks, signature writes in, button presses to Signed (final: signed)
 * ExecutedScene   stamped (default true), sealSize, stampDelayMs
 * RolesScene      highlight 'administrator' | 'signer' | 'contributor' | null, adminCanSign (default true)
 * FanOutScene     step 0..3 deals shown (default 3), autoplay
 * OldWayScene     step 0..5 items struck through (default 5), autoplay
 *
 * NDA_TEXT_COUNTS: real counts from the template (legalWords, variableFields, ...).
 */
export { DocumentScene, DocumentExcerptBody, type DocumentSceneProps } from './DocumentScene';
export { FillScene, type FillSceneProps } from './FillScene';
export { ShareScene, type ShareSceneProps } from './ShareScene';
export { SignScene, type SignSceneProps } from './SignScene';
export { ExecutedScene, type ExecutedSceneProps } from './ExecutedScene';
export { RolesScene, type RolesSceneProps } from './RolesScene';
export { FanOutScene, type FanOutSceneProps } from './FanOutScene';
export { OldWayScene, type OldWaySceneProps } from './OldWayScene';
export { NDA_COUNTS as NDA_TEXT_COUNTS } from './_shared';

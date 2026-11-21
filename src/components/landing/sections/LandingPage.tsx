'use client';

/*
 * The landing page (option A, "living document", picked 2026-11-21 in T-098).
 * The NDA sheet is the hero, then one pinned scroll story carries the same deal from fill to seal.
 */

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PricingSection from '@/components/marketing/PricingSection';
import {
  DocumentScene,
  FillScene,
  ShareScene,
  SignScene,
  ExecutedScene,
  RolesScene,
  OldWayScene,
  FanOutScene,
} from '@/components/landing/scenes';
import {
  MotionStyles,
  HeroStage,
  Sequence,
  SeqItem,
  LineReveal,
  ScrollStory,
  useScrollStep,
  type StoryVisualContext,
} from '@/components/landing/motion';
import { FILL_ORDER, SAMPLE_EVIDENCE } from '@/lib/landing/sampleDeal';
import { PrimaryCta, SecondaryCta, BetaNote, FaqList, Disclaimer } from './shared';

const WRAP = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';
const H2 = 'font-display text-4xl font-bold leading-[1.02] tracking-[-0.035em] text-ink sm:text-5xl lg:text-6xl [overflow-wrap:break-word] min-w-0';

const STORY = [
  {
    n: '1',
    title: 'Fill in the deal.',
    body: 'Add the parties, purpose, dates and term. The legal text is already done.',
  },
  {
    n: '2',
    title: 'Send the link.',
    body: 'You get a secure link and a ready-written message. Send it from your own inbox, so it arrives from someone they know.',
  },
  {
    n: '3',
    title: 'They review and sign.',
    body: 'They open the link in their browser. No account, no download. We nudge them at 48 hours and 5 days if needed.',
  },
  {
    n: '4',
    title: 'Signed, with the proof attached.',
    body: 'Who signed, when, from where, and exactly which version. You both get the signed PDF.',
  },
];

/**
 * Pinned: each scene plays once when its step becomes active, then rests; the seal stamps 380ms
 * after step 4 arrives (once the sheet has settled). Stacked / no-JS / reduced motion: final states.
 */
function StoryVisual({ step, ctx }: { step: number; ctx: StoryVisualContext }) {
  const live = ctx.pinned && ctx.active;
  switch (step) {
    case 0:
      return <FillScene autoplay={live} />;
    case 1:
      return <ShareScene autoplay={live} />;
    case 2:
      return <SignScene autoplay={live} />;
    default:
      return <ExecutedScene stamped={!ctx.pinned || ctx.active} stampDelayMs={ctx.pinned ? 380 : 0} sealSize={168} />;
  }
}

function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { step } = useScrollStep(ref, 6);
  return (
    <section className="border-b border-line bg-white py-24 lg:py-32">
      <div ref={ref} className={`${WRAP} grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20`}>
        <div className="min-w-0">
          <LineReveal className={H2} lines={['A new NDA.', 'A new review.', 'Every deal.']} />
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-ink">
            Each NDA arrives as a fresh document, so someone reads it all again, even when the text barely changes.
          </p>
          <p className="mt-10 border-l-2 border-teal-800 pl-4 text-lg font-semibold text-ink">
            With FormalizeIt: one standard NDA. Review it once, then fill in only the deal.
          </p>
        </div>
        <div className="min-w-0">
          <OldWayScene step={step} size="lg" />
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <main id="main" className="bg-white">
      <MotionStyles />

      {/* Hero */}
      <section className="relative border-b border-line bg-ground">
        <div className={`${WRAP} grid grid-cols-1 items-center gap-12 pb-20 pt-14 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-12`}>
          <Sequence trigger="load" className="min-w-0">
            <h1 className="font-display text-[clamp(3.5rem,9vw,7.25rem)] font-bold leading-[0.9] tracking-[-0.05em] text-ink [overflow-wrap:break-word]">
              NDA in
              <br />
              minutes.
            </h1>
            <SeqItem order={1}>
              <p className="mt-7 max-w-[30ch] text-xl leading-snug text-muted-ink">
                Start from the standard NDA, fill in what&apos;s different, and send.
              </p>
            </SeqItem>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <PrimaryCta />
              <SeqItem order={2} as="span">
                <SecondaryCta />
              </SeqItem>
            </div>
            <SeqItem order={3}>
              <BetaNote className="mt-5" />
            </SeqItem>
          </Sequence>
          {/* Hidden until hydration, then rises in already empty and fills once (never filled-then-empty). */}
          <HeroStage className="min-w-0" last={FILL_ORDER.length} intervalMs={220} startDelayMs={450} revealDelayMs={120}>
            {(i) => <DocumentScene variant="excerpt" filled={i ?? FILL_ORDER.length} />}
          </HeroStage>
        </div>
      </section>

      <ProblemSection />

      {/* The idea */}
      <section className="bg-ground py-24 lg:py-32">
        <div className={`${WRAP} grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20`}>
          <div className="order-2 min-w-0 lg:order-1">
            <FanOutScene size="lg" />
          </div>
          <div className="order-1 min-w-0 lg:order-2">
            <LineReveal className={H2} lines={['One standard.', 'Fill in only', "what's different."]} />
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-ink">
              A balanced mutual NDA with the same legal text every time, so there is nothing new to read.
            </p>
            <dl className="mt-10 space-y-5">
              {[
                ['Same text, every deal.', 'Fixed wording. It only changes with a new published version.'],
                ['Fair to both sides.', 'One mutual NDA, not pro-sender or pro-receiver.'],
                ['You fill in the deal.', 'Parties, purpose, dates, term, governing law, contacts, and one optional extra clause.'],
              ].map(([t, d]) => (
                <div key={t} className="border-t border-line pt-5">
                  <dt className="text-base font-semibold text-ink">{t}</dt>
                  <dd className="mt-1 text-base leading-relaxed text-muted-ink">{d}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/standard-nda"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 transition-colors hover:text-teal-700"
            >
              Read the standard NDA
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works + evidence: one pinned story */}
      <section id="how-it-works" aria-label="How FormalizeIt works" className="scroll-mt-28 border-y border-line bg-white pt-24 lg:pt-32">
        <div className={WRAP}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <LineReveal className={H2} lines={['Three steps.', 'A few minutes.']} />
            <p className="max-w-sm text-lg leading-relaxed text-muted-ink">
              Fill in the deal, send a link, they sign. No account for the other side.
            </p>
          </div>
          <ScrollStory
            className="mt-12 lg:mt-16"
            steps={STORY.map((s) => ({
              id: s.n,
              content: (
                <div className="max-w-md py-2">
                  <p className="font-doc-mono text-sm text-muted-ink">0{s.n}</p>
                  <h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] text-ink lg:text-4xl">{s.title}</h3>
                  <p className="mt-4 text-lg leading-relaxed text-muted-ink">{s.body}</p>
                </div>
              ),
            }))}
            renderVisual={(i, ctx) => <StoryVisual step={i} ctx={ctx} />}
          />
        </div>
        <div className="border-t border-line bg-ground py-14">
          <div className={`${WRAP} grid grid-cols-1 gap-8 md:grid-cols-3`}>
            <p className="text-base leading-relaxed text-muted-ink">
              <span className="font-semibold text-ink">Authority confirmed.</span> Signers confirm they&apos;re authorized to sign for their company before the Sign button unlocks.
            </p>
            <p className="text-base leading-relaxed text-muted-ink">
              <span className="font-semibold text-ink">Kept for 5 years.</span> Signed NDAs are kept for 5 years from signing, with notice before anything is deleted.
            </p>
            <div>
              <p className="font-doc-mono text-sm text-muted-ink">
                Sample record: {SAMPLE_EVIDENCE.versionLabel}, {SAMPLE_EVIDENCE.hashShort}
              </p>
              <Disclaimer className="mt-3" />
            </div>
          </div>
        </div>
      </section>

      {/* Teams */}
      <section className="bg-white py-24 lg:py-32">
        <div className={`${WRAP} grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20`}>
          <div className="min-w-0">
            <LineReveal className={H2} lines={['Everyone moves the deal.', 'One person signs.']} />
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-ink">
              Teammates draft and send from one shared workspace. Only signers sign for the company.
            </p>
            <p className="mt-8 text-base font-semibold text-ink">NDAs belong to the company, not one inbox.</p>
          </div>
          <div className="min-w-0">
            <RolesScene />
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-28 border-t border-line bg-ground py-24 lg:py-32">
        <PricingSection />
      </section>

      {/* FAQ */}
      <section className="border-t border-line bg-white py-24 lg:py-32">
        <div className={`${WRAP} grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20`}>
          <div>
            <h2 className={H2}>Quick answers</h2>
            <p className="mt-4 text-lg text-muted-ink">The full list is on the FAQ page.</p>
          </div>
          <FaqList />
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-line bg-ground py-24 lg:py-36">
        <div className={WRAP}>
          <LineReveal
            as="h2"
            className="max-w-4xl font-display text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[0.98] tracking-[-0.045em] text-ink"
            lines={['Your next NDA can be done', 'before the meeting ends.']}
          />
          <p className="mt-6 max-w-lg text-lg text-muted-ink">Fill in the deal, send the link, get it signed.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <PrimaryCta />
            <SecondaryCta />
          </div>
          <BetaNote className="mt-5" />
          <Disclaimer className="mt-10" />
        </div>
      </section>
    </main>
  );
}

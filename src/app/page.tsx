"use client";
import { useAuth } from "@clerk/nextjs";
import SignupButton from "@/components/SignupButton";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FileText,
  PenLine,
  ScanSearch,
  Shield,
  Users,
  Zap,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import PricingSection from "@/components/marketing/PricingSection";
import { HeroSheet } from "@/components/marketing/HeroSheet";
import { Button } from "@/components/ui/button";
import { NEW_NDA_HREF } from "@/lib/newNdaHref";
import { faqs } from "./faq/faq-data";

/* ─── Data ────────────────────────────────────────────────── */
const STEPS = [
  {
    number: "1",
    title: "Start from the standard NDA",
    description:
      "One balanced mutual NDA with fixed legal text. Review it once, reuse it for every deal.",
    icon: FileText,
  },
  {
    number: "2",
    title: "Fill the variables",
    description:
      "Customize key details like company names, dates, and terms using smart fields.",
    icon: PenLine,
  },
  {
    number: "3",
    title: "Review only the changes",
    description:
      "Effortlessly identify and approve modifications, skipping the redlining process.",
    icon: ScanSearch,
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: "Template-first workflow",
    description:
      "Start from a proven NDA structure. Focus your review only on the terms that actually change.",
  },
  {
    icon: CheckCircle,
    title: "Role-based permissions",
    description:
      "Anyone on the team can draft and send. Only your designated Signers sign for the company.",
  },
  {
    icon: Shield,
    title: "Signature evidence, recorded",
    description:
      "Encrypted storage and e-signatures. Every signed NDA records the signer, timestamp, IP address and NDA version.",
  },
  {
    icon: Users,
    title: "Team collaboration",
    description:
      "Teammates draft and send from one shared workspace. No more emailing PDFs back and forth.",
  },
  {
    icon: TrendingUp,
    title: "Full status tracking",
    description:
      "See every NDA — draft, sent, in review, or signed — from a single dashboard.",
  },
  {
    icon: Zap,
    title: "Fast turnaround",
    description:
      "Automated workflows and instant notifications mean NDAs get signed in hours, not days.",
  },
];

// A curated taste of the FAQ — the full list lives at /faq.
const TEASER_FAQ_INDEXES = [0, 2, 5, 13];

/* ─── Stat ────────────────────────────────────────────────── */
function AnimatedStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 text-center sm:px-6">
      <div className="font-doc-mono text-xl font-medium tracking-tight text-ink sm:text-2xl md:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-ink">{label}</div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function Home() {
  const { userId } = useAuth();
  const reduceMotion = useReducedMotion();

  const fadeUp = {
    initial: reduceMotion ? {} : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  const stagger = {
    initial: {},
    animate: { transition: { staggerChildren: 0.09 } },
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="border-b border-line bg-ground">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center lg:px-8 lg:py-14">
          <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14">

            {/* Left: copy */}
            <motion.div initial={false} animate="animate" variants={stagger}>
              <motion.h1
                variants={fadeUp}
                className="mb-6 font-display text-5xl font-bold leading-[0.98] tracking-[-0.04em] text-ink sm:text-6xl lg:text-7xl"
              >
                NDA in{" "}
                <span className="bg-[linear-gradient(var(--color-teal-100),var(--color-teal-100))] bg-[length:100%_10px] bg-[position:0_88%] bg-no-repeat">
                  minutes
                </span>
                .
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mb-8 max-w-[30ch] text-lg leading-snug text-muted-ink sm:text-xl"
              >
                Start from the standard NDA, fill in what&apos;s different, and send.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
                {userId ? (
                  <Button asChild shape="crisp" size="lg">
                    <Link href={NEW_NDA_HREF}>
                      Send your NDA now
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                ) : (
                  <SignupButton>
                    <Button shape="crisp" size="lg">
                      Send your NDA now
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </SignupButton>
                )}
                <Button asChild shape="crisp" size="lg" variant="outline" className="shadow-none">
                  <Link href="/standard-nda">Read the standard NDA</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Right: the standard NDA, variables filling in */}
            <div className="flex justify-center lg:justify-end">
              <HeroSheet />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS + STATS
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-ink md:text-5xl">
              Three steps. That&apos;s the whole process.
            </h2>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <RevealItem key={step.number}>
                <div className="h-full rounded-sheet border border-line bg-white p-6 shadow-sheet">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-control bg-ground text-teal-800">
                      <step.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="select-none font-doc-mono text-sm text-muted-ink">
                      0{step.number}
                    </span>
                  </div>
                  <h3 className="mb-1.5 font-display text-lg font-semibold tracking-tight text-ink">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-ink">
                    {step.description}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* Stats */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 divide-x divide-line border-y border-line py-6">
            {[
              { value: "< 5 min", label: "from template to sent" },
              { value: "0", label: "recipient accounts needed" },
              { value: "Every", label: "signed NDA records signature evidence" },
            ].map((s) => (
              <AnimatedStat key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════ */}
      <section className="border-y border-line bg-ground py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-12">
            <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-ink md:text-5xl">
              Fast by design. Built with security in mind.
            </h2>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <RevealItem key={i}>
                <div className="h-full rounded-sheet border border-line bg-white p-6">
                  <h3 className="mb-1.5 flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-ink">
                    <f.icon className="h-5 w-5 shrink-0 text-teal-800" aria-hidden="true" />
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-ink">
                    {f.description}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════ */}
      <section id="pricing" className="scroll-mt-28 bg-white py-20 lg:py-28">
        <PricingSection />
      </section>

      {/* ══════════════════════════════════════════════
          FAQ TEASER
      ══════════════════════════════════════════════ */}
      <section className="border-y border-line bg-ground py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-ink md:text-5xl">
              Good questions, quick answers
            </h2>
          </Reveal>

          <Reveal>
            <Accordion type="single" collapsible className="space-y-2">
              {TEASER_FAQ_INDEXES.map((faqIndex) => (
                <AccordionItem
                  key={faqIndex}
                  value={`item-${faqIndex}`}
                  className="rounded-sheet border border-line bg-white px-5 transition-colors duration-200 data-[state=open]:border-teal-700"
                >
                  <AccordionTrigger className="py-4 text-sm font-semibold text-ink hover:no-underline">
                    {faqs[faqIndex].question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-ink">
                    {faqs[faqIndex].answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="text-center mt-8">
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:text-teal-700 transition-colors"
              >
                All questions
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="mb-4 font-display text-3xl font-bold tracking-[-0.03em] text-ink md:text-5xl">
              Your next NDA, sent in minutes.
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-muted-ink md:text-lg">
              Start from the standard NDA, fill in what&apos;s different, send. No lawyer required.
            </p>
            {userId ? (
              <Button asChild shape="crisp" size="lg">
                <Link href={NEW_NDA_HREF}>
                  Send your NDA now
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <SignupButton>
                <Button shape="crisp" size="lg">
                  Start in seconds
                  <ArrowRight aria-hidden="true" />
                </Button>
              </SignupButton>
            )}
          </Reveal>
        </div>
      </section>

    </div>
  );
}

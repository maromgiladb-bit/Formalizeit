"use client";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
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
import { faqs } from "./faq/faq-data";

/* ─── Data ────────────────────────────────────────────────── */
const STEPS = [
  {
    number: "1",
    title: "Choose a trusted template",
    description:
      "Select from industry-standard, pre-vetted NDA templates for any situation.",
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
    title: "Role-based approvals",
    description:
      "Contributors draft, approvers review, owners finalize. Clear accountability at every stage.",
  },
  {
    icon: Shield,
    title: "Secure & compliant",
    description:
      "Bank-level encryption, full audit trails, and legally binding digital signatures on every agreement.",
  },
  {
    icon: Users,
    title: "Team collaboration",
    description:
      "Comment, suggest, and co-edit together. No more emailing PDFs back and forth.",
  },
  {
    icon: TrendingUp,
    title: "Full status tracking",
    description:
      "See every NDA — draft, in review, approved, sent, or signed — from a single dashboard.",
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

/* ─── Document Mockup ─────────────────────────────────────── */
function DocumentMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      {/* Document card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-float overflow-hidden">
        {/* Doc header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          </div>
          <div className="text-xs font-semibold text-gray-400 tracking-wide">NDA_Agreement.docx</div>
          <div className="w-12" />
        </div>

        {/* Doc body */}
        <div className="px-6 py-5 space-y-3">
          {/* Title line */}
          <div className="h-3 bg-ink rounded w-2/3 mb-5" />

          {/* Regular lines */}
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-5/6" />
          <div className="h-2 bg-gray-200 rounded w-full" />

          {/* Highlighted row — Variable */}
          <div className="flex items-center gap-2 rounded-md bg-teal-50 border border-teal-200 px-3 py-2 mt-2">
            <div className="h-2 bg-teal-400 rounded w-1/3" />
            <div className="h-2 bg-teal-200 rounded flex-1" />
          </div>

          {/* Regular lines */}
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-4/5" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-3/4" />

          {/* Highlighted row — Custom Clause */}
          <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
            <div className="h-2 bg-amber-400 rounded w-2/5" />
            <div className="h-2 bg-amber-200 rounded flex-1" />
          </div>

          {/* Regular lines */}
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-5/6" />
        </div>
      </div>

      {/* Floating tooltip */}
      <div className="hidden sm:block absolute -right-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-xl shadow-float px-4 py-3 w-52">
        <p className="text-xs font-semibold text-ink leading-snug">
          Review only the changes:
        </p>
        <p className="text-xs text-teal-700 font-medium mt-0.5">
          Variables &amp; Custom Clauses
        </p>
      </div>
    </div>
  );
}

/* ─── Animated stat ───────────────────────────────────────── */
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();
  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-teal-800 tracking-tight"
      >
        {value}
      </motion.div>
      <div className="text-gray-500 text-sm mt-1 font-medium">{label}</div>
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
    <div className="min-h-screen bg-white font-sans">

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: copy */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-ink leading-[1.05] tracking-tight mb-6"
            >
              NDA in<br />minutes.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg text-gray-500 leading-relaxed mb-8 max-w-md"
            >
              You don&apos;t reinvent the NDA each time. Pick a trusted template,
              fill in what&apos;s different, and send — no back-and-forth, no
              formatting drama, no blank page.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
              {userId ? (
                <Link
                  href="/templates"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-card transition-colors duration-200 text-sm"
                >
                  Send your NDA now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-card transition-colors duration-200 text-sm cursor-pointer">
                    Send Your First NDA Free
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </SignUpButton>
              )}
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-ink hover:bg-gray-100 font-semibold rounded-xl transition-colors duration-200 text-sm"
              >
                See pricing
              </a>
            </motion.div>
          </motion.div>

          {/* Right: document mockup */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="flex justify-center lg:justify-end pr-8 lg:pr-14"
          >
            <DocumentMockup />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS + STATS
      ══════════════════════════════════════════════ */}
      <section className="bg-gray-50 border-y border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-12 text-center">
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
              Three steps. That&apos;s the whole process.
            </h2>
          </Reveal>

          <RevealGroup className="relative grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Connecting line behind the cards (desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gray-200" aria-hidden="true" />
            {STEPS.map((step) => (
              <RevealItem key={step.number}>
                <div className="relative bg-white rounded-2xl border border-gray-100 shadow-card p-7 h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-teal-700" />
                    </div>
                    <span className="text-4xl font-extrabold text-gray-200 leading-none select-none">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-ink mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
            {[
              { value: "< 5 min", label: "from template to sent" },
              { value: "0", label: "recipient accounts needed" },
              { value: "100%", label: "audit-trailed & binding" },
            ].map((s) => (
              <AnimatedStat key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-12">
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">
              Capabilities
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
              Fast by design. Secure by default.
            </h2>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <RevealItem key={i}>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-card hover:shadow-float transition-shadow duration-200 h-full cursor-default">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-teal-700" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
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
      <section id="pricing" className="scroll-mt-28 bg-gray-50 border-y border-gray-100 py-20">
        <PricingSection />
      </section>

      {/* ══════════════════════════════════════════════
          FAQ TEASER
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-10 text-center">
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">
              FAQ
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
              Good questions, quick answers
            </h2>
          </Reveal>

          <Reveal>
            <Accordion type="single" collapsible className="space-y-3">
              {TEASER_FAQ_INDEXES.map((faqIndex) => (
                <AccordionItem
                  key={faqIndex}
                  value={`item-${faqIndex}`}
                  className="bg-white rounded-2xl border border-gray-200 px-6 data-[state=open]:border-teal-600 transition-colors duration-200"
                >
                  <AccordionTrigger className="text-ink text-sm font-semibold hover:no-underline py-5">
                    {faqs[faqIndex].question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-500 leading-relaxed pb-5">
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
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section className="bg-teal-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Your next NDA, sent in minutes.
            </h2>
            <p className="text-teal-100 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              Pick a template, fill in what&apos;s different, send. No lawyer required.
            </p>
            {userId ? (
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-gray-100 text-teal-900 font-semibold rounded-xl shadow-float transition-colors duration-200 text-sm"
              >
                Send your NDA now
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-gray-100 text-teal-900 font-semibold rounded-xl shadow-float transition-colors duration-200 text-sm cursor-pointer">
                  Start in seconds
                  <ArrowRight className="w-4 h-4" />
                </button>
              </SignUpButton>
            )}
          </Reveal>
        </div>
      </section>

    </div>
  );
}

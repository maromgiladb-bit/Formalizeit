"use client";
import { SignUpButton } from "@clerk/nextjs";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
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

/* ─── Motion variants ─────────────────────────────────────── */
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.09 } },
};

/* ─── Data ────────────────────────────────────────────────── */
const STEPS = [
  {
    number: "1",
    title: "Choose a Trusted Template",
    description:
      "Select from industry-standard, pre-vetted NDA templates for any situation.",
    icon: FileText,
  },
  {
    number: "2",
    title: "Fill the Variables",
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

/* ─── Document Mockup ─────────────────────────────────────── */
function DocumentMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      {/* Document card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        {/* Doc header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
          </div>
          <div className="text-xs font-semibold text-gray-400 tracking-wide">NDA_Agreement.docx</div>
          <div className="w-12" />
        </div>

        {/* Doc body */}
        <div className="px-6 py-5 space-y-3">
          {/* Title line */}
          <div className="h-3 bg-gray-800 rounded w-2/3 mb-5" />

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
      <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 w-52">
        <p className="text-xs font-semibold text-gray-800 leading-snug">
          Review only the changes:
        </p>
        <p className="text-xs text-teal-600 font-medium mt-0.5">
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
  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-3xl md:text-4xl font-extrabold text-teal-700 tracking-tight"
      >
        {value}
      </motion.div>
      <div className="text-gray-500 text-sm mt-1 font-medium">{label}</div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: copy */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5"
            >
              You don&apos;t reinvent<br />the NDA each time.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-base text-gray-500 leading-relaxed mb-8 max-w-sm"
            >
              Streamline your non-disclosure agreement workflows. Review only the
              changes, not the entire document, and close deals faster with FormalizeIt.
            </motion.p>
            <motion.div variants={fadeUp}>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer">
                  Get Started for Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </SignUpButton>
            </motion.div>
          </motion.div>

          {/* Right: document mockup */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="flex justify-center lg:justify-end pr-8 lg:pr-14"
          >
            <DocumentMockup />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">How it Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="flex gap-4">
                {/* Icon circle */}
                <div className="flex-shrink-0 w-11 h-11 rounded-full bg-teal-800 flex items-center justify-center shadow-sm">
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {step.number}. {step.title}
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════ */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: "10,000+", label: "NDAs created" },
              { value: "2×", label: "faster avg. turnaround" },
              { value: "99.9%", label: "uptime" },
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
          <motion.div
            className="mb-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
          >
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">
              Capabilities
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Everything your team needs
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-60px" }}
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-200 cursor-default"
              >
                <div className="w-10 h-10 bg-teal-50 group-hover:bg-teal-100 rounded-lg flex items-center justify-center mb-4 transition-colors duration-200">
                  <f.icon className="w-5 h-5 text-teal-700" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  );
}

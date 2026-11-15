"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { inputClassesCrisp } from "@/components/ui/input";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.09 } },
};

const contactCards = [
  {
    icon: Mail,
    title: "Email Us",
    description: "For general inquiries and support",
    link: "mailto:support@formalizeit.com",
    linkLabel: "support@formalizeit.com",
  },
];

const emptyForm = { firstName: "", lastName: "", email: "", subject: "", message: "", company: "" };

export default function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const update = (field: keyof typeof emptyForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send your message.");
      }
      setStatus("success");
      setForm(emptyForm);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-ground">

      {/* Header + Content */}
      <section className="bg-ground py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={false}
            animate="animate"
            variants={stagger}
          >
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-display font-bold text-ink tracking-[-0.03em]">Get in Touch</motion.h1>
            <motion.p variants={fadeUp} className="text-sm text-muted-ink leading-relaxed mt-1 max-w-lg">
              Have questions about our NDA platform? We&apos;re here to help!
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Contact info cards */}
            <motion.div
              className="lg:col-span-1 space-y-4"
              initial={false}
              whileInView="animate"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
            >
              {contactCards.map((card) => (
                <motion.div
                  key={card.title}
                  variants={fadeUp}
                  className="group bg-white p-6 rounded-sheet border border-line"
                >
                  <div className="w-10 h-10 bg-ground border border-line rounded-control flex items-center justify-center mb-4">
                    <card.icon className="w-5 h-5 text-teal-800" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-sm font-semibold text-ink mb-1.5">{card.title}</h3>
                  <p className="text-sm text-muted-ink leading-relaxed whitespace-pre-line">{card.description}</p>
                  {card.link && card.linkLabel && (
                    <a
                      href={card.link}
                      className="inline-block mt-3 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors duration-150"
                    >
                      {card.linkLabel}
                    </a>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Contact form */}
            <motion.div
              className="lg:col-span-2"
              initial={false}
              whileInView="animate"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
            >
              <div className="bg-white rounded-sheet border border-line p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Send us a Message</h2>
                </div>

                {status === "success" ? (
                  <div className="flex items-start gap-3 rounded-sheet border border-line bg-white p-4">
                    <CheckCircle className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-teal-800">Message sent</p>
                      <p className="text-sm text-muted-ink">Thanks for reaching out — we&apos;ll get back to you soon.</p>
                      <button
                        type="button"
                        onClick={() => setStatus("idle")}
                        className="mt-3 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
                      >
                        Send another message
                      </button>
                    </div>
                  </div>
                ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* Honeypot — hidden from real users; bots that fill it are dropped server-side. */}
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={update("company")}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="hidden"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-muted-ink mb-1.5">First Name</label>
                      <input
                        type="text"
                        required
                        value={form.firstName}
                        onChange={update("firstName")}
                        className={inputClassesCrisp}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-ink mb-1.5">Last Name</label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={update("lastName")}
                        className={inputClassesCrisp}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-ink mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={update("email")}
                      className={inputClassesCrisp}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-ink mb-1.5">Subject</label>
                    <select
                      value={form.subject}
                      onChange={update("subject")}
                      className={inputClassesCrisp}
                    >
                      <option value="">Select a topic</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Sales Inquiry">Sales Inquiry</option>
                      <option value="Partnership Opportunity">Partnership Opportunity</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-ink mb-1.5">Message</label>
                    <textarea
                      rows={5}
                      required
                      value={form.message}
                      onChange={update("message")}
                      className={`${inputClassesCrisp} resize-none`}
                      placeholder="How can we help you?"
                    />
                  </div>

                  {status === "error" && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <Button
                    type="submit"
                    shape="crisp"
                    size="lg"
                    disabled={status === "submitting"}
                  >
                    {status === "submitting" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" aria-hidden="true" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="border-t border-line bg-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
            initial={false}
            whileInView="animate"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Looking for answers first?</h2>
              <p className="text-sm text-muted-ink">Check our FAQ for quick answers to common questions.</p>
            </div>
            <Button asChild shape="crisp" size="lg" variant="outline" className="shadow-none">
              <Link href="/faq">
                Browse FAQ
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

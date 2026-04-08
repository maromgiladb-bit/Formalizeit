"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, ArrowRight } from "lucide-react";
import Link from "next/link";

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
    link: "mailto:support@ndasaas.com",
    linkLabel: "support@ndasaas.com",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Mon-Fri from 9am to 6pm EST",
    link: "tel:+15551234567",
    linkLabel: "+1 (555) 123-4567",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    description: "123 Legal Tech Blvd\nSan Francisco, CA 94105",
    link: null,
    linkLabel: null,
  },
];

export default function Contact() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Header + Content */}
      <section className="bg-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">Contact</motion.p>
            <motion.h1 variants={fadeUp} className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Get in Touch</motion.h1>
            <motion.p variants={fadeUp} className="text-sm text-gray-500 leading-relaxed mt-1 max-w-lg">
              Have questions about our NDA platform? We&apos;re here to help!
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Contact info cards */}
            <motion.div
              className="lg:col-span-1 space-y-4"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
            >
              {contactCards.map((card) => (
                <motion.div
                  key={card.title}
                  variants={fadeUp}
                  className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-teal-50 group-hover:bg-teal-100 rounded-lg flex items-center justify-center mb-4 transition-colors duration-200">
                    <card.icon className="w-5 h-5 text-teal-700" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">{card.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{card.description}</p>
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
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
                <div className="mb-6">
                  <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">Message</p>
                  <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
                </div>

                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">First Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Last Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subject</label>
                    <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all bg-white text-gray-700">
                      <option value="">Select a topic</option>
                      <option value="support">Technical Support</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="partnership">Partnership Opportunity</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message</label>
                    <textarea
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="border-t border-gray-100 bg-gray-50 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <div>
              <h2 className="text-lg font-bold text-gray-900">Looking for answers first?</h2>
              <p className="text-sm text-gray-500">Check our FAQ for quick answers to common questions.</p>
            </div>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm cursor-pointer"
            >
              Browse FAQ
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

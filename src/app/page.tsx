"use client";
import { useUser, SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle, Shield, Users, Zap, TrendingUp } from "lucide-react";
import { AnimatedHero } from "@/components/ui/animated-hero";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const featureCards = [
  {
    icon: FileText,
    title: "Easy Creation",
    description: "Create professional NDAs in minutes with our step-by-step wizard and pre-built templates.",
    gradient: "from-teal-600 to-blue-600"
  },
  {
    icon: CheckCircle,
    title: "Digital Signatures",
    description: "Send NDAs for electronic signatures and track signing status in real-time.",
    gradient: "from-green-600 to-emerald-600"
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    description: "Bank-level security and legal compliance to protect your confidential information.",
    gradient: "from-purple-600 to-indigo-600"
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Share drafts with team members and collaborate on NDA creation seamlessly.",
    gradient: "from-orange-600 to-red-600"
  },
  {
    icon: TrendingUp,
    title: "Status Tracking",
    description: "Monitor NDA status from draft to signed with comprehensive tracking features.",
    gradient: "from-blue-600 to-cyan-600"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Quick turnaround times with automated workflows and instant notifications.",
    gradient: "from-pink-600 to-rose-600"
  }
];

const stats = [
  { value: "10,000+", label: "NDAs Created" },
  { value: "99.9%", label: "Uptime" },
  { value: "5,000+", label: "Happy Users" }
];

export default function Home() {
  const { isLoaded } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        {/* Hero Section */}
        <div className="relative bg-gray-50 border-b border-gray-200 overflow-hidden">
          <div className="relative">
            {mounted && (
              <AnimatedHero onLearnMore={() => router.push("/about")} />
            )}
          </div>
        </div>

        {/* Stats Section */}
        <motion.div
          className="bg-white py-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-teal-600 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="text-4xl font-bold text-teal-600 mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-semibold">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          className="py-12 bg-gray-50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything You Need for NDAs
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Powerful features to streamline your confidentiality agreements
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {featureCards.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-teal-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="bg-gray-100 py-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2
              className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Ready to streamline your NDAs?
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Join thousands of businesses who trust our platform for their confidentiality agreements.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SignUpButton mode="modal">
                <button className="group px-10 py-5 bg-gray-900 text-white text-lg font-semibold rounded-lg shadow-xl hover:bg-gray-800 transition-all duration-200 hover:scale-105">
                  Start Creating NDAs Today
                  <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </SignUpButton>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

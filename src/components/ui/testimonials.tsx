'use client';

import React from 'react';
import { motion } from "framer-motion";

// --- Types ---
interface Testimonial {
    text: string;
    image: string;
    name: string;
    role: string;
}

// --- NDA Platform Testimonials ---
const testimonials: Testimonial[] = [
    {
        text: "Formalize It revolutionized how we handle NDAs. What used to take days now takes minutes. The collaboration features are fantastic.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Sarah Chen",
        role: "General Counsel, TechStart Inc",
    },
    {
        text: "Finally, an NDA platform that lawyers and business teams both love. Clear change tracking and instant PDF generation saved us countless hours.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Michael Torres",
        role: "VP of Business Development",
    },
    {
        text: "The bidirectional editing feature is a game-changer. Both parties can suggest changes in real-time without email ping-pong.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Emily Watson",
        role: "Partnerships Manager",
    },
    {
        text: "We've cut our NDA turnaround time by 80%. The intuitive interface means even our non-legal team members can prepare documents.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
        name: "David Park",
        role: "CEO, Innovation Labs",
    },
    {
        text: "Party B can fill in their details and suggest changes without creating an account. This removed so much friction from our process.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Amanda Richards",
        role: "Operations Director",
    },
    {
        text: "The professional templates and live preview ensure our NDAs look perfect every time. No more formatting surprises.",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Jessica Kim",
        role: "Legal Operations Manager",
    },
    {
        text: "Auto-fill from company profiles saves incredible time when you're sending multiple NDAs per week.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Robert Martinez",
        role: "Sales Director",
    },
    {
        text: "Crystal-clear audit trails and change tracking. Our compliance team finally has confidence in our NDA process.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Lisa Thompson",
        role: "Compliance Officer",
    },
    {
        text: "From draft to signed PDF in under 10 minutes. This platform has transformed how fast we can close partnerships.",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
        name: "James Wilson",
        role: "Business Development Lead",
    },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

// --- Sub-Components ---
const TestimonialsColumn = (props: {
    className?: string;
    testimonials: Testimonial[];
    duration?: number;
}) => {
    return (
        <div className={props.className}>
            <motion.ul
                animate={{
                    translateY: "-50%",
                }}
                transition={{
                    duration: props.duration || 10,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                }}
                className="flex flex-col gap-6 pb-6 bg-transparent transition-colors duration-300 list-none m-0 p-0"
            >
                {[
                    ...new Array(2).fill(0).map((_, index) => (
                        <React.Fragment key={index}>
                            {props.testimonials.map(({ text, image, name, role }, i) => (
                                <motion.li
                                    key={`${index}-${i}`}
                                    aria-hidden={index === 1 ? "true" : "false"}
                                    tabIndex={index === 1 ? -1 : 0}
                                    whileHover={{
                                        scale: 1.03,
                                        y: -8,
                                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                                        transition: { type: "spring", stiffness: 400, damping: 17 }
                                    }}
                                    whileFocus={{
                                        scale: 1.03,
                                        y: -8,
                                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                                        transition: { type: "spring", stiffness: 400, damping: 17 }
                                    }}
                                    className="p-8 rounded-2xl border border-gray-200 shadow-lg shadow-black/5 max-w-xs w-full bg-white transition-all duration-300 cursor-default select-none group focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                >
                                    <blockquote className="m-0 p-0">
                                        <p className="text-gray-600 leading-relaxed font-normal m-0 transition-colors duration-300">
                                            {text}
                                        </p>
                                        <footer className="flex items-center gap-3 mt-6">
                                            <img
                                                width={40}
                                                height={40}
                                                src={image}
                                                alt={`Avatar of ${name}`}
                                                className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-teal-500/30 transition-all duration-300 ease-in-out"
                                            />
                                            <div className="flex flex-col">
                                                <cite className="font-semibold not-italic tracking-tight leading-5 text-gray-900 transition-colors duration-300">
                                                    {name}
                                                </cite>
                                                <span className="text-sm leading-5 tracking-tight text-gray-500 mt-0.5 transition-colors duration-300">
                                                    {role}
                                                </span>
                                            </div>
                                        </footer>
                                    </blockquote>
                                </motion.li>
                            ))}
                        </React.Fragment>
                    )),
                ]}
            </motion.ul>
        </div>
    );
};

export default function TestimonialsSection() {
    return (
        <section
            aria-labelledby="testimonials-heading"
            className="bg-gray-50 py-24 relative overflow-hidden"
        >
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                }}
                className="container px-4 z-10 mx-auto"
            >
                <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-16">
                    <div className="flex justify-center">
                        <div className="border border-teal-300 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-teal-600 bg-teal-50">
                            Testimonials
                        </div>
                    </div>

                    <h2 id="testimonials-heading" className="text-4xl md:text-5xl font-bold tracking-tight mt-6 text-center text-gray-900">
                        Trusted by legal teams everywhere
                    </h2>
                    <p className="text-center mt-5 text-gray-500 text-lg leading-relaxed max-w-sm">
                        See how teams streamline their NDA workflows with Formalize It.
                    </p>
                </div>

                <div
                    className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[740px] overflow-hidden"
                    role="region"
                    aria-label="Scrolling Testimonials"
                >
                    <TestimonialsColumn testimonials={firstColumn} duration={15} />
                    <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
                    <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
                </div>
            </motion.div>
        </section>
    );
}

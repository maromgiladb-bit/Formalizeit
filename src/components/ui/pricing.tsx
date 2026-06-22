"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import NumberFlow from "@number-flow/react";

interface PricingPlan {
    name: string;
    price: string;
    yearlyPrice: string;
    period: string;
    features: string[];
    description: string;
    buttonText: string;
    href: string;
    isPopular: boolean;
    onClickAction?: (isMonthly: boolean) => void;
}

interface PricingProps {
    plans: PricingPlan[];
    title?: string;
    description?: string;
}

export function Pricing({
    plans,
    title = "Simple, Transparent Pricing",
    description = "Choose the plan that works for you.\nAll plans include secure e-signatures and PDF export.",
}: PricingProps) {
    const [isMonthly, setIsMonthly] = useState(true);
    const reduceMotion = useReducedMotion();

    return (
        <div className="container pt-6 pb-16">
            {(title || description) && (
                <div className="text-center space-y-4 mb-12">
                    {title && (
                        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-ink">
                            {title}
                        </h2>
                    )}
                    {description && (
                        <p className="text-gray-500 text-lg whitespace-pre-line max-w-2xl mx-auto">
                            {description}
                        </p>
                    )}
                </div>
            )}

            <div className="flex justify-center items-center gap-3 mb-10">
                <span className={cn("text-sm font-medium", isMonthly ? "text-ink" : "text-gray-500")}>Monthly</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <Label>
                        <Switch
                            checked={!isMonthly}
                            onCheckedChange={(checked) => setIsMonthly(!checked)}
                            className="relative"
                        />
                    </Label>
                </label>
                <span className={cn("text-sm font-medium", !isMonthly ? "text-ink" : "text-gray-500")}>
                    Annual <span className="text-teal-700 font-semibold">(Save 20%)</span>
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {plans.map((plan, index) => (
                    <motion.div
                        key={index}
                        initial={reduceMotion ? false : { y: 24, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
                        className={cn(
                            "rounded-2xl p-8 text-center flex flex-col relative bg-white",
                            plan.isPopular
                                ? "border border-teal-600 ring-1 ring-teal-600 shadow-float"
                                : "border border-gray-200 shadow-card"
                        )}
                    >
                        {plan.isPopular && (
                            <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                                <div className="bg-amber-500 text-ink py-1 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-card">
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                    Most popular
                                </div>
                            </div>
                        )}
                        <div className="flex-1 flex flex-col">
                            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
                                {plan.name}
                            </p>
                            <div className="mt-4 flex items-baseline justify-center gap-x-1">
                                <span className="text-5xl font-extrabold tracking-tight text-ink">
                                    {plan.price === "Custom" ? (
                                        "Custom"
                                    ) : (
                                        <NumberFlow
                                            value={isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)}
                                            format={{
                                                style: "currency",
                                                currency: "USD",
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            }}
                                            transformTiming={{
                                                duration: 500,
                                                easing: "ease-out",
                                            }}
                                            willChange
                                            className="tabular-nums"
                                        />
                                    )}
                                </span>
                                {plan.period && plan.price !== "Custom" && (
                                    <span className="text-sm font-medium text-gray-500">
                                        /{plan.period}
                                    </span>
                                )}
                            </div>

                            {plan.price !== "Custom" && (
                                <p className="text-xs mt-1 text-gray-500">
                                    {isMonthly ? "billed monthly" : "billed annually"}
                                </p>
                            )}

                            <ul className="mt-6 space-y-3 text-left flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 flex-shrink-0 mt-0.5 text-teal-700" />
                                        <span className="text-sm text-gray-700">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8">
                                {plan.onClickAction ? (
                                    <button
                                        type="button"
                                        onClick={() => plan.onClickAction!(isMonthly)}
                                        className={cn(
                                            buttonVariants({ variant: plan.isPopular ? "default" : "outline", size: "lg" }),
                                            "w-full"
                                        )}
                                    >
                                        {plan.buttonText}
                                    </button>
                                ) : (
                                    <Link
                                        href={plan.href}
                                        className={cn(
                                            buttonVariants({ variant: plan.isPopular ? "default" : "outline", size: "lg" }),
                                            "w-full"
                                        )}
                                    >
                                        {plan.buttonText}
                                    </Link>
                                )}
                            </div>
                            <p className="mt-4 text-xs text-gray-500">
                                {plan.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

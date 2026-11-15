"use client";

import { buttonVariants } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
    /** Replaces the "Most popular" badge text on the highlighted plan. */
    badge?: string;
    /** Plan isn't purchasable yet: neutral "Coming soon" pill and a disabled button. Prices stay visible. */
    comingSoon?: boolean;
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

    return (
        <div className="container pt-6 pb-16">
            {(title || description) && (
                <div className="text-center space-y-4 mb-12">
                    {title && (
                        <h2 className="font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl text-ink">
                            {title}
                        </h2>
                    )}
                    {description && (
                        <p className="text-muted-ink text-lg whitespace-pre-line max-w-2xl mx-auto">
                            {description}
                        </p>
                    )}
                </div>
            )}

            <div className="flex justify-center items-center gap-3 mb-10">
                <span className={cn("text-sm font-medium", isMonthly ? "text-ink" : "text-muted-ink")}>Monthly</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <Label>
                        <Switch
                            checked={!isMonthly}
                            onCheckedChange={(checked) => setIsMonthly(!checked)}
                            className="relative"
                        />
                    </Label>
                </label>
                <span className={cn("text-sm font-medium", !isMonthly ? "text-ink" : "text-muted-ink")}>
                    Annual <span className="text-teal-700 font-semibold">(Save 15%)</span>
                </span>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 ${plans.length <= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`}>
                {plans.map((plan, index) => (
                    <motion.div
                        key={index}
                        initial={false}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
                        className={cn(
                            "rounded-sheet p-7 text-left flex flex-col relative bg-white border",
                            plan.isPopular
                                ? "border-teal-700 ring-1 ring-teal-700 shadow-sheet"
                                : "border-line"
                        )}
                    >
                        {plan.isPopular && (
                            <div className="absolute -top-3 left-6">
                                {plan.badge ? (
                                    <div className="bg-teal-800 text-white py-1 px-3 rounded-control font-display text-xs font-semibold">
                                        {plan.badge}
                                    </div>
                                ) : (
                                    <div className="bg-amber-500 text-ink py-1 px-3 rounded-control flex items-center gap-1.5 font-display text-xs font-semibold">
                                        <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                                        Most popular
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center gap-2">
                                <p className="font-display text-base font-semibold text-ink">
                                    {plan.name}
                                </p>
                                {plan.comingSoon && <StatusPill tone="neutral" label="Coming soon" shape="crisp" />}
                            </div>
                            <div className="mt-4 flex items-baseline gap-x-1">
                                <span className="font-display text-5xl font-bold tracking-[-0.03em] text-ink">
                                    {plan.price === "Custom" ? (
                                        "Custom"
                                    ) : (
                                        <NumberFlow
                                            value={isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)}
                                            format={{
                                                style: "currency",
                                                currency: "USD",
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2,
                                            }}
                                            transformTiming={{
                                                duration: 500,
                                                easing: "ease-out",
                                            }}
                                            willChange
                                            className="font-doc-mono tabular-nums"
                                        />
                                    )}
                                </span>
                                {plan.period && plan.price !== "Custom" && (
                                    <span className="text-sm font-medium text-muted-ink">
                                        /{plan.period}
                                    </span>
                                )}
                            </div>

                            {plan.price !== "Custom" && (
                                <p className="font-doc-mono text-xs mt-1 text-muted-ink">
                                    {isMonthly ? "billed monthly" : "billed annually"}
                                </p>
                            )}

                            <ul className="mt-6 space-y-3 text-left flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 flex-shrink-0 mt-0.5 text-teal-800" aria-hidden="true" />
                                        <span className="text-sm text-gray-700">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8">
                                {plan.comingSoon ? (
                                    <button
                                        type="button"
                                        disabled
                                        className={cn(buttonVariants({ variant: "outline", size: "lg", shape: "crisp" }), "w-full")}
                                    >
                                        {plan.buttonText}
                                    </button>
                                ) : plan.onClickAction ? (
                                    <button
                                        type="button"
                                        onClick={() => plan.onClickAction!(isMonthly)}
                                        className={cn(
                                            buttonVariants({ variant: plan.isPopular ? "default" : "outline", size: "lg", shape: "crisp" }),
                                            "w-full"
                                        )}
                                    >
                                        {plan.buttonText}
                                    </button>
                                ) : (
                                    <Link
                                        href={plan.href}
                                        className={cn(
                                            buttonVariants({ variant: plan.isPopular ? "default" : "outline", size: "lg", shape: "crisp" }),
                                            "w-full"
                                        )}
                                    >
                                        {plan.buttonText}
                                    </Link>
                                )}
                            </div>
                            <p className="mt-4 text-xs text-muted-ink">
                                {plan.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

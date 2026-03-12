"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
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
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const switchRef = useRef<HTMLButtonElement>(null);

    const handleToggle = (checked: boolean) => {
        setIsMonthly(!checked);
        if (checked && switchRef.current) {
            const rect = switchRef.current.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            confetti({
                particleCount: 50,
                spread: 60,
                origin: {
                    x: x / window.innerWidth,
                    y: y / window.innerHeight,
                },
                colors: [
                    "#0d9488", // teal-600
                    "#14b8a6", // teal-500
                    "#5eead4", // teal-300
                    "#f0fdfa", // teal-50
                ],
                ticks: 200,
                gravity: 1.2,
                decay: 0.94,
                startVelocity: 30,
                shapes: ["circle"],
            });
        }
    };

    return (
        <div className="container pt-6 pb-20">
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-gray-900">
                    {title}
                </h2>
                <p className="text-gray-600 text-lg whitespace-pre-line max-w-2xl mx-auto">
                    {description}
                </p>
            </div>

            <div className="flex justify-center items-center gap-3 mb-10">
                <span className={cn("font-medium", isMonthly ? "text-gray-900" : "text-gray-500")}>Monthly</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <Label>
                        <Switch
                            ref={switchRef as React.Ref<HTMLButtonElement>}
                            checked={!isMonthly}
                            onCheckedChange={handleToggle}
                            className="relative"
                        />
                    </Label>
                </label>
                <span className={cn("font-medium", !isMonthly ? "text-gray-900" : "text-gray-500")}>
                    Annual <span className="text-teal-600 font-semibold">(Save 20%)</span>
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {plans.map((plan, index) => (
                    <motion.div
                        key={index}
                        initial={{ y: 50, opacity: 0 }}
                        whileInView={
                            isDesktop
                                ? {
                                    y: plan.isPopular ? -20 : 0,
                                    opacity: 1,
                                    x: index === 2 ? -20 : index === 0 ? 20 : 0,
                                    scale: index === 0 || index === 2 ? 0.95 : 1.0,
                                }
                                : { opacity: 1, y: 0 }
                        }
                        viewport={{ once: true }}
                        transition={{
                            duration: 1.2,
                            type: "spring",
                            stiffness: 100,
                            damping: 30,
                            delay: 0.2 + index * 0.1,
                            opacity: { duration: 0.5 },
                        }}
                        className={cn(
                            `rounded-2xl border p-8 text-center flex flex-col relative`,
                            plan.isPopular
                                ? "border-teal-600 border-2 bg-slate-900 text-white shadow-xl"
                                : "border-gray-200 bg-white",
                            !plan.isPopular && "mt-5 md:mt-0",
                            index === 0 || index === 2 ? "z-0" : "z-10",
                            index === 0 && "origin-right",
                            index === 2 && "origin-left"
                        )}
                    >
                        {plan.isPopular && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <div className="bg-teal-600 text-white py-1.5 px-4 rounded-full flex items-center gap-1.5 text-sm font-semibold shadow-lg">
                                    <Star className="h-4 w-4 fill-current" />
                                    Popular
                                </div>
                            </div>
                        )}
                        <div className="flex-1 flex flex-col">
                            <p className={cn("text-sm font-semibold uppercase tracking-wide",
                                plan.isPopular ? "text-teal-400" : "text-gray-500"
                            )}>
                                {plan.name}
                            </p>
                            <div className="mt-4 flex items-baseline justify-center gap-x-1">
                                <span className={cn("text-5xl font-bold tracking-tight",
                                    plan.isPopular ? "text-white" : "text-gray-900"
                                )}>
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
                                    <span className={cn("text-sm font-medium",
                                        plan.isPopular ? "text-gray-400" : "text-gray-500"
                                    )}>
                                        /{plan.period}
                                    </span>
                                )}
                            </div>

                            {plan.price !== "Custom" && (
                                <p className={cn("text-xs mt-1", plan.isPopular ? "text-gray-400" : "text-gray-500")}>
                                    {isMonthly ? "billed monthly" : "billed annually"}
                                </p>
                            )}

                            <ul className="mt-6 space-y-3 text-left flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <Check className={cn("h-5 w-5 flex-shrink-0 mt-0.5",
                                            plan.isPopular ? "text-teal-400" : "text-teal-600"
                                        )} />
                                        <span className={plan.isPopular ? "text-gray-300" : "text-gray-700"}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8">
                                <Link
                                    href={plan.href}
                                    className={cn(
                                        buttonVariants({ variant: "outline" }),
                                        "w-full py-3 text-base font-semibold transition-all duration-300",
                                        plan.isPopular
                                            ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700 hover:border-teal-700"
                                            : "bg-white text-gray-900 border-gray-900 hover:bg-gray-900 hover:text-white"
                                    )}
                                >
                                    {plan.buttonText}
                                </Link>
                            </div>
                            <p className={cn("mt-4 text-xs", plan.isPopular ? "text-gray-400" : "text-gray-500")}>
                                {plan.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

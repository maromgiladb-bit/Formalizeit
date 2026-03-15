"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignUpButton } from "@clerk/nextjs";

interface AnimatedHeroProps {
    onLearnMore?: () => void;
}

function AnimatedHero({ onLearnMore }: AnimatedHeroProps) {
    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(
        () => ["effortless", "secure", "professional", "collaborative", "instant"],
        []
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (titleNumber === titles.length - 1) {
                setTitleNumber(0);
            } else {
                setTitleNumber(titleNumber + 1);
            }
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    return (
        <div className="w-full">
            <div className="container mx-auto">
                <div className="flex gap-8 py-20 lg:py-32 items-center justify-center flex-col">
                    <div className="flex gap-4 flex-col">
                        <h1 className="text-5xl md:text-7xl max-w-4xl tracking-tight text-center font-bold">
                            <span className="text-[var(--navy-900)]">Make NDAs</span>
                            <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                                &nbsp;
                                {titles.map((title, index) => (
                                    <motion.span
                                        key={index}
                                        className="absolute font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500"
                                        initial={{ opacity: 0, y: "-100" }}
                                        transition={{ type: "spring", stiffness: 50 }}
                                        animate={
                                            titleNumber === index
                                                ? {
                                                    y: 0,
                                                    opacity: 1,
                                                }
                                                : {
                                                    y: titleNumber > index ? -150 : 150,
                                                    opacity: 0,
                                                }
                                        }
                                    >
                                        {title}
                                    </motion.span>
                                ))}
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl leading-relaxed tracking-tight text-gray-900 max-w-3xl text-center mx-auto">
                            Streamline your confidentiality agreements with our intuitive platform.
                            Generate, customize, and manage NDAs with just a few clicks.
                        </p>
                    </div>
                    <div className="flex flex-row gap-4">
                        <Button
                            size="lg"
                            variant="outline"
                            className="gap-2 border-[var(--navy-700)] text-[var(--navy-800)] hover:bg-slate-100"
                            onClick={onLearnMore}
                        >
                            Learn More
                        </Button>
                        <SignUpButton mode="modal">
                            <Button size="lg" className="gap-2 bg-gray-900 hover:bg-gray-800 text-white">
                                Get Started Free <MoveRight className="w-4 h-4" />
                            </Button>
                        </SignUpButton>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { AnimatedHero };

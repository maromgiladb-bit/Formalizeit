import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text?: string;
}

const InteractiveHoverButton = React.forwardRef<
    HTMLButtonElement,
    InteractiveHoverButtonProps
>(({ text = "Button", className, ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn(
                "group relative w-28 cursor-pointer overflow-hidden rounded-full border border-gray-900 bg-white p-1.5 text-center text-sm font-semibold text-gray-900 transition-all duration-300 hover:bg-gray-900 hover:text-white",
                className,
            )}
            {...props}
        >
            <span className="relative z-10 inline-block transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-0">
                {text}
            </span>
            <div className="absolute top-0 z-20 flex h-full w-full -translate-x-4 items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                <span>{text}</span>
                <ArrowRight className="h-4 w-4" />
            </div>
        </button>
    );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };

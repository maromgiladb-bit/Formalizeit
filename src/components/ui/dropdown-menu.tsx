"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type DropdownMenuProps = {
  options: {
    label: string;
    onClick: () => void;
    Icon?: React.ReactNode;
  }[];
  children: React.ReactNode;
  className?: string;
  menuClassName?: string;
};

const DropdownMenu = ({ options, children, className, menuClassName }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <Button
        onClick={toggleDropdown}
        variant="outline"
        size="sm"
        className={cn("rounded-lg", className)}
      >
        {children ?? "Menu"}
        <motion.span
          className="ml-1"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.4, ease: "easeInOut", type: "spring" }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: -5, scale: 0.95, filter: "blur(10px)" }}
            animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ y: -5, scale: 0.95, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "circInOut", type: "spring" }}
            className={cn(
              "absolute z-10 w-48 mt-1 p-1 bg-white rounded-xl border border-gray-200 shadow-lg flex flex-col gap-0.5",
              menuClassName
            )}
          >
            {options && options.length > 0 ? (
              options.map((option, index) => (
                <motion.button
                  initial={{ opacity: 0, x: 10, scale: 0.95, filter: "blur(10px)" }}
                  animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: 10, scale: 0.95, filter: "blur(10px)" }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: "easeInOut",
                    type: "spring",
                  }}
                  whileHover={{
                    backgroundColor: "rgba(0,0,0,0.05)",
                    transition: { duration: 0.2, ease: "easeInOut" },
                  }}
                  whileTap={{
                    scale: 0.95,
                    transition: { duration: 0.2, ease: "easeInOut" },
                  }}
                  key={option.label}
                  onClick={() => {
                    option.onClick();
                    setIsOpen(false);
                  }}
                  className="px-3 py-2 cursor-pointer text-gray-700 text-sm rounded-lg w-full text-left flex items-center gap-x-2"
                >
                  {option.Icon}
                  {option.label}
                </motion.button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-xs">No options</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { DropdownMenu };

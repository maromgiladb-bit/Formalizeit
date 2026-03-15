import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StateIconProps {
    size?: number | string;
    color?: string;
    className?: string;
    active?: boolean;
}

export function NotificationIcon({ size = 40, color = "#111827", className, active = false }: StateIconProps) {
    return (
        <motion.svg viewBox="0 0 40 40" fill="none" className={cn("", className)}
            animate={active ? { rotate: [0, 8, -8, 6, -6, 3, 0] } : { rotate: 0 }}
            transition={{ duration: 0.6, repeat: active ? Infinity : 0, repeatDelay: 3 }}
            style={{ width: size, height: size, transformOrigin: "20px 6px" }}>
            <path d="M28 16a8 8 0 00-16 0c0 8-4 10-4 10h24s-4-2-4-10" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17.5 30a3 3 0 005 0" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
            <motion.circle cx="28" cy="10" r="4" fill="#EF4444"
                animate={active
                    ? { scale: [0, 1.3, 1], opacity: 1 }
                    : { scale: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            />
        </motion.svg>
    );
}

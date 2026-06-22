'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'formalize-profile-prompt-dismissed';

export default function ProfilePrompt() {
  const [visible, setVisible] = useState(false);
  const [neverShow, setNeverShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    // Small delay so it doesn't flash immediately on page load
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    if (neverShow) localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
          exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
          className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 rounded-2xl shadow-float p-4 flex items-start gap-3 max-w-xs w-full"
        >
          <div className="w-9 h-9 bg-teal-800 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink">Saves you time</p>
            <p className="text-sm text-gray-500 mt-0.5 leading-snug">
              Fill in your company profile once and we&apos;ll auto-fill Party A details on every NDA.
            </p>
            <Link
              href="/settings/company-profile"
              onClick={dismiss}
              className="inline-block mt-2.5 text-sm font-semibold text-teal-800 hover:text-teal-700 transition-colors"
            >
              Set up profile →
            </Link>
            <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={neverShow}
                onChange={e => setNeverShow(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-teal-700 cursor-pointer"
              />
              <span className="text-xs text-gray-400">Don&apos;t show again</span>
            </label>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-gray-400 hover:text-gray-600 leading-none shrink-0 cursor-pointer mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

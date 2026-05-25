'use client';

import { SignInButton } from '@clerk/nextjs';
import { ArrowRight, FileText, Shield, Zap, Users } from 'lucide-react';

export default function ComingSoonPage() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white">
      {/* Top accent bar */}
      <div className="h-1 w-full flex-shrink-0 bg-gradient-to-r from-teal-800 via-teal-600 to-amber-400" />

      {/* Body: two columns */}
      <div className="flex-1 grid grid-cols-2 min-h-0">

        {/* ── Left: Branding ───────────────────────────────────── */}
        <div className="flex flex-col justify-center px-16 xl:px-24 bg-white border-r border-gray-100">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="relative">
              <div className="w-12 h-12 bg-teal-800 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white" />
            </div>
            <span className="text-lg font-extrabold text-gray-900 tracking-tight">FormalizeIt</span>
          </div>

          {/* Label */}
          <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-4">
            Private Beta
          </p>

          {/* Big heading */}
          <h1 className="text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5">
            NDAs without<br />
            the{' '}
            <span className="relative inline-block">
              <span className="relative z-10">blank page.</span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-amber-200 rounded -z-0" />
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-md">
            Start from trusted templates. Customize key details. Review only the terms that actually changed — not the whole document.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold rounded-full">
              <Shield className="w-3.5 h-3.5" />
              Trusted templates
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
              <Zap className="w-3.5 h-3.5" />
              Review only what changed
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold rounded-full">
              <Users className="w-3.5 h-3.5" />
              Team collaboration
            </span>
          </div>
        </div>

        {/* ── Right: Sign-in ───────────────────────────────────── */}
        <div className="flex flex-col justify-center items-center px-16 xl:px-24 bg-gray-50">
          <div className="w-full max-w-sm">
            {/* Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm mb-6">
              <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-4">
                Access
              </p>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                Already have access?
              </h2>
              <p className="text-sm text-gray-500 mb-7">
                Sign in to continue to your dashboard and manage your NDAs.
              </p>
              <SignInButton mode="modal" forceRedirectUrl="/">
                <button className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer">
                  Sign In to FormalizeIt
                  <ArrowRight className="w-4 h-4" />
                </button>
              </SignInButton>
            </div>

            {/* Decorative status row */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse flex-shrink-0" />
              <p className="text-xs text-gray-500">
                Platform is live — <span className="text-gray-900 font-medium">private testing in progress</span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="absolute bottom-5 text-xs text-gray-400">
            © {new Date().getFullYear()} FormalizeIt. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}

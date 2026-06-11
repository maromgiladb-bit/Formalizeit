import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white font-sans flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-4">404</p>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Page not found</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          This page doesn&apos;t exist or has been moved. Head back to the dashboard to continue.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

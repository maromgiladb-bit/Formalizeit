import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ground font-sans flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="font-doc-mono text-sm text-muted-ink mb-4">Error 404</p>
        <h1 className="text-3xl font-display font-semibold tracking-tight text-ink mb-3">Page not found</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          This page doesn&apos;t exist or has been moved. Head back to the dashboard to continue.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-control transition-colors duration-200 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

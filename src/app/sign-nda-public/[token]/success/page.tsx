import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function SignSuccessPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    // Verify signer exists (optional validation)
    const signer = await prisma.signer.findUnique({
        where: { id: token },
        select: { id: true, status: true, name: true }
    });

    if (!signer) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-float border border-gray-100 p-8 text-center animate-appear-zoom">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-ink mb-2">
                    Sign Sent Successfully!
                </h1>

                <p className="text-gray-600 mb-8">
                    Your signature has been securely recorded. The final document will be sent to all parties once everyone has signed.
                </p>

                <div className="space-y-3">
                    <Link
                        href={`/api/claim?signerId=${signer.id}`}
                        className="block w-full px-5 py-3 bg-teal-800 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-card"
                    >
                        Create a free account to keep this NDA
                    </Link>

                    <p className="text-xs text-gray-400">
                        Your signed NDA stays accessible for 5 years. Create an account to download it anytime — even if you sign up with a different email.
                    </p>

                    <Link
                        href="/"
                        className="block w-full px-5 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                        Back to Home Page
                    </Link>
                </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-400">
                <p className="mb-1">Encrypted &middot; Audit-trailed &middot; Powered by FormalizeIt</p>
                &copy; {new Date().getFullYear()} FormalizeIt. All rights reserved.
            </div>
        </div>
    );
}

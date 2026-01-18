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
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Sign Sent Successfully!
                </h1>

                <p className="text-gray-600 mb-8">
                    Your signature has been securely recorded. The final document will be sent to all parties once everyone has signed.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/"
                        className="block w-full px-5 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-md hover:shadow-lg"
                    >
                        Back to Home Page
                    </Link>

                    <Link
                        href="/about"
                        className="block w-full px-5 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                        Learn more about FormalizeIt
                    </Link>
                </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-400">
                &copy; {new Date().getFullYear()} FormalizeIt. All rights reserved.
            </div>
        </div>
    );
}

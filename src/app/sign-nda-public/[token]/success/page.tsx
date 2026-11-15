import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { isValidSignLinkToken } from '@/lib/signLink';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function SignSuccessPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    if (!isValidSignLinkToken(token)) {
        notFound();
    }

    // Verify signer exists (optional validation)
    const signer = await prisma.signer.findUnique({
        where: { id: token },
        select: { id: true, status: true, name: true }
    });

    if (!signer) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-sheet shadow-sheet border border-line p-8 text-center animate-appear-zoom">
                <div className="flex justify-center mb-5">
                    {/* Plain check, not the Seal: this page shows after ONE party signs, and the
                        seal reads "Executed". The seal is reserved for fully signed NDAs. */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-800 text-white">
                        <Check className="h-7 w-7" strokeWidth={2.6} aria-hidden="true" />
                    </div>
                </div>

                <h1 className="font-display text-2xl font-bold tracking-tight text-ink mb-2">
                    Signed successfully
                </h1>

                <p className="text-muted-ink mb-8">
                    Your signature has been securely recorded. The final document will be sent to all parties once everyone has signed.
                </p>

                <div className="space-y-3">
                    <Button asChild shape="crisp" size="lg" className="w-full">
                        <Link href={`/api/claim?signerId=${signer.id}`}>
                            Create a free account to keep this NDA
                        </Link>
                    </Button>

                    <p className="text-xs text-gray-500">
                        Create a free account to track your NDA progress and get quick access.
                    </p>

                    <Button asChild variant="outline" shape="crisp" size="lg" className="w-full shadow-none">
                        <Link href="/">
                            Back to Home Page
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="mt-8 text-center text-sm text-muted-ink">
                <p className="mb-1">Encrypted and audit-trailed. Powered by FormalizeIt.</p>
                &copy; {new Date().getFullYear()} FormalizeIt. All rights reserved.
            </div>
        </div>
    );
}

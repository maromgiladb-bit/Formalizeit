'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Great_Vibes } from 'next/font/google';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';
import { Button } from '@/components/ui/button';
import { inputClassesCrisp } from '@/components/ui/input';
import { AUTHORITY_CONSENT_TEXT, TERMS_CONSENT_TEXT } from '@/lib/authorityConsentText';

const greatVibes = Great_Vibes({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-great-vibes',
});

interface SignNDAPublicClientProps {
    signerId: string;
    signerEmail: string;
    signerName: string;
    ndaTitle: string;
    formData: Record<string, unknown>;
    templateId: string;
    initialHtml: string;
    signerRole?: 'partyA' | 'partyB';
}

export default function SignNDAPublicClient({
    signerId,
    signerEmail,
    signerName: initialName,
    ndaTitle,
    formData,
    templateId,
    initialHtml,
    signerRole = 'partyB',
}: SignNDAPublicClientProps) {
    const router = useRouter();
    const [signature, setSignature] = useState({
        name: initialName,
        title: '',
        date: new Date().toISOString().split('T')[0],
    });

    const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('type');
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const signatureCardRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [typedSignature, setTypedSignature] = useState('');
    const [authorityConfirmed, setAuthorityConfirmed] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string>(initialHtml);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    // Below lg the side-by-side preview column is hidden; this drives the
    // stacked, collapsible preview so mobile signers can still read the NDA.
    const [showMobilePreview, setShowMobilePreview] = useState(false);
    const documentRef = useRef<HTMLDivElement>(null);

    // Set initial HTML on mount
    useEffect(() => {
        setPreviewHtml(initialHtml);
    }, [initialHtml]);

    // Listen for sign-box click-to-field messages from the preview iframe
    // Only reacts to signature box IDs; ignores all other NDA field clicks
    useEffect(() => {
        const handleSignBoxClick = (e: MessageEvent) => {
            if (
                e.data?.type === 'field-click' &&
                (e.data.field === 'party-a-signature' || e.data.field === 'party-b-signature')
            ) {
                // Switch to type mode so the signature input is visible
                setSignatureMode('type');

                // Highlight the signature card
                if (signatureCardRef.current) {
                    signatureCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    signatureCardRef.current.style.boxShadow = '0 0 0 4px rgba(251, 191, 36, 0.6)';
                    setTimeout(() => {
                        if (signatureCardRef.current) signatureCardRef.current.style.boxShadow = '';
                    }, 2000);
                }

                // Focus the typed signature input after mode switch renders
                setTimeout(() => {
                    const sigInput = document.querySelector<HTMLInputElement>('input[data-testid="signature-input"]');
                    if (sigInput) {
                        sigInput.focus();
                        sigInput.style.boxShadow = '0 0 0 3px rgba(251, 191, 36, 0.6)';
                        setTimeout(() => { sigInput.style.boxShadow = ''; }, 2000);
                    }
                }, 300);
            }
        };
        window.addEventListener('message', handleSignBoxClick);
        return () => window.removeEventListener('message', handleSignBoxClick);
    }, []);

    // Canvas drawing handlers
    // Pointer events cover mouse, touch, and pen. The canvas is CSS-stretched to
    // the column width but keeps a fixed 400px backing store, so map client
    // coordinates into canvas space or strokes drift on narrow screens.
    const canvasPoint = (canvas: HTMLCanvasElement, e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height),
        };
    };

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.setPointerCapture(e.pointerId);
        setIsDrawing(true);
        const { x, y } = canvasPoint(canvas, e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = canvasPoint(canvas, e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing && canvasRef.current) {
            setSignatureImage(canvasRef.current.toDataURL());
        }
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureImage(null);
    };

    // Update preview HTML when signature changes
    useEffect(() => {
        if (!previewHtml) return;


        let updatedHtml = previewHtml;

        // If we have a signature, inject it into the HTML
        if (signatureImage) {
            let injected = false;

            // Determine the signature box ID based on signer role
            const signatureBoxId = signerRole === 'partyA' ? 'party-a-signature' : 'party-b-signature';
            const signatureBoxIndex = signerRole === 'partyA' ? 1 : 2;

            // Pattern 1: Professional template - <div class="sign-box" id="party-X-signature">
            const professionalPattern = new RegExp(`(<div class="sign-box" id="${signatureBoxId}">)([\\s\\S]*?)(</div>)`);
            if (professionalPattern.test(updatedHtml)) {
                updatedHtml = updatedHtml.replace(
                    professionalPattern,
                    `$1<img src="${signatureImage}" alt="Signature" style="max-height: 70px; max-width: 100%; display: block; margin: auto;" />$3`
                );
                injected = true;
            }

            // Pattern 2: Look for Nth signature box if pattern 1 didn't match
            if (!injected) {
                const signBoxes = updatedHtml.match(/<div class="sign-box"[^>]*>([\s\S]*?)<\/div>/g);
                if (signBoxes && signBoxes.length >= signatureBoxIndex) {
                    // Replace the appropriate signature box
                    let count = 0;
                    updatedHtml = updatedHtml.replace(
                        /<div class="sign-box"([^>]*)>([\s\S]*?)<\/div>/g,
                        (match, attrs, content) => {
                            count++;
                            if (count === signatureBoxIndex) {
                                return `<div class="sign-box"${attrs}><img src="${signatureImage}" alt="Signature" style="max-height: 70px; max-width: 100%; display: block; margin: auto;" /></div>`;
                            }
                            return match;
                        }
                    );
                    injected = true;
                }
            }

            // Pattern 3: Fallback - look for any signature-related div
            if (!injected) {
                const fallbackPattern = /(<div[^>]*(?:id|class)="[^"]*signature[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/i;
                if (fallbackPattern.test(updatedHtml)) {
                    updatedHtml = updatedHtml.replace(
                        fallbackPattern,
                        `$1<img src="${signatureImage}" alt="Signature" style="max-height: 60px; display: block; margin: 4px auto;" />$3`
                    );
                    injected = true;
                }
            }

            if (!injected) {
                console.warn('⚠️ Could not find signature placeholder in HTML template');
            }

            setPreviewHtml(updatedHtml);
        }
    }, [signatureImage, previewHtml, signerRole]);

    // The signer must scroll to the end of the NDA before signing. A hidden
    // element (clientHeight 0) never counts, so the desktop panel can't unlock
    // signing on mobile and vice versa.
    const markIfAtEnd = (el: Element | null) => {
        if (!el || el.clientHeight === 0) return;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
            setHasScrolledToBottom(true);
        }
    };

    const handleScroll = () => markIfAtEnd(documentRef.current);

    // Desktop: grow the iframe to its content so only the side panel scrolls,
    // then re-check (a short NDA that fits on screen counts as read).
    const handleDesktopPreviewLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
        const doc = e.currentTarget.contentDocument;
        if (!doc) return;
        e.currentTarget.style.height = `${doc.documentElement.scrollHeight}px`;
        handleScroll();
    };

    // Mobile: the iframe has a fixed height and scrolls itself, so track its
    // inner document. The listener goes away with the old document on reload.
    const handleMobilePreviewLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
        const frame = e.currentTarget;
        const doc = frame.contentDocument;
        if (!doc) return;
        const scroller = doc.scrollingElement ?? doc.documentElement;
        const check = () => {
            if (frame.clientHeight === 0) return;
            markIfAtEnd(scroller);
        };
        frame.contentWindow?.addEventListener('scroll', check, { passive: true });
        check();
    };

    // Typed signature
    const handleTypedChange = (value: string) => {
        setTypedSignature(value);
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `48px ${greatVibes.style.fontFamily}`;
        ctx.fillStyle = 'black';
        ctx.fillText(value, 20, 60);

        setSignatureImage(canvas.toDataURL());
    };

    // Upload signature
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setSignatureImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Submit signature
    const handleSubmit = async () => {

        if (!hasScrolledToBottom) {
            setError('Please read the entire NDA before signing');
            return;
        }

        if (!signature.name || !signature.title) {
            setError('Please fill in all required fields');
            return;
        }

        if (!signatureImage) {
            setError('Please provide a signature');
            return;
        }

        if (!authorityConfirmed) {
            setError('Please confirm you are authorized to sign on behalf of your company');
            return;
        }

        if (!termsAccepted) {

            setError('Please agree to the Terms of Service and Privacy Policy and consent to sign electronically');

            return;

        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/ndas/sign-public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signerId,
                    signerName: signature.name,
                    signerTitle: signature.title,
                    signatureImage,
                    signatureDate: signature.date,
                    authorityConfirmed,
                    termsAccepted,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Company-side signing requires an authenticated signer — send them to
                // sign in and return here to complete signing.
                if (response.status === 401 && result.code === 'AUTH_REQUIRED') {
                    const returnUrl = encodeURIComponent(window.location.pathname);
                    router.push(`/sign-in?redirect_url=${returnUrl}`);
                    return;
                }
                throw new Error(result.error || 'Failed to submit signature');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push(`/sign-nda-public/${signerId}/success`);
            }, 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit signature');
        } finally {
            setLoading(false);
        }
    };



    const checkboxClasses =
        'mt-0.5 h-4 w-4 shrink-0 rounded-[4px] border-gray-300 text-teal-800 focus:ring-teal-700/30 cursor-pointer';
    const labelClasses = 'block text-xs font-semibold text-gray-500 mb-1.5';

    return (
        <div className="min-h-screen bg-ground flex flex-col">
            {/* Header, then document (left) and sign panel (right, docked on desktop) */}
            <div className="flex flex-col h-screen overflow-hidden">
                <header className="shrink-0 border-b border-line bg-white px-4 py-3 lg:px-8 lg:py-4">
                    <div className="inline-flex items-center gap-1.5 text-muted-ink text-xs font-doc-mono mb-1">
                        <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Secure NDA link
                    </div>
                    <h1 className="font-display text-lg lg:text-2xl font-bold tracking-tight text-ink leading-tight">{ndaTitle}</h1>
                    <p className="text-sm text-muted-ink mt-0.5">Review the document and add your signature below.</p>
                </header>

                <div className="flex flex-1 min-h-0">
                    {/* LEFT SIDE: Document (dominant on desktop) */}
                    <div
                        ref={documentRef}
                        onScroll={handleScroll}
                        className="hidden lg:flex lg:flex-col flex-1 min-w-0 h-full bg-ground overflow-y-auto"
                    >
                        <div className="sticky top-0 bg-ground border-b border-line px-8 py-3 z-10">
                            <p className="text-gray-700 text-sm font-semibold">Document Preview</p>
                        </div>
                        <div className="p-8 flex-1">
                            <div className="bg-white border border-line rounded-sheet shadow-sheet p-6 max-w-[860px] mx-auto">
                                {previewHtml ? (
                                    <iframe
                                        srcDoc={previewHtml}
                                        className="w-full border-0"
                                        style={{ minHeight: '1200px', height: 'auto' }}
                                        title="NDA Preview"
                                        sandbox="allow-same-origin allow-scripts"
                                        onLoad={handleDesktopPreviewLoad}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-64">
                                        <p className="text-sm text-gray-500">Loading preview...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Sign panel (docked on desktop, stacked on phones) */}
                    <aside
                        aria-label="Sign this NDA"
                        className="w-full lg:w-[420px] lg:shrink-0 h-full overflow-y-auto bg-ground lg:bg-white lg:border-l border-line"
                    >
                        <div className="flex flex-col w-full px-4 py-5 lg:px-6 lg:py-6">
                            {/* Mobile / tablet: stacked document preview (the side column is lg-only) */}
                            <div className="lg:hidden mb-4 bg-white rounded-sheet border border-line overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setShowMobilePreview(v => !v)}
                                    aria-expanded={showMobilePreview}
                                    className="w-full flex items-center justify-between px-4 py-3.5 text-left cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <span className="text-sm font-semibold text-ink">
                                        {showMobilePreview ? 'Hide document' : 'Read the full NDA'}
                                    </span>
                                    <svg aria-hidden="true"
                                        className={`w-4 h-4 text-gray-500 transition-transform ${showMobilePreview ? 'rotate-180' : ''}`}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showMobilePreview && (
                                    <div className="border-t border-line">
                                        {previewHtml ? (
                                            <iframe
                                                srcDoc={previewHtml}
                                                className="w-full border-0 h-[70vh]"
                                                title="NDA Preview"
                                                sandbox="allow-same-origin allow-scripts"
                                                onLoad={handleMobilePreviewLoad}
                                            />
                                        ) : (
                                            <p className="p-6 text-sm text-gray-500">Loading preview...</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div ref={signatureCardRef} className="bg-white lg:bg-transparent rounded-sheet lg:rounded-none border border-line lg:border-0 p-5 lg:p-0 flex flex-col">
                                {/* Authority-to-sign affirmation */}
                                <label className="flex items-start gap-3 mb-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={authorityConfirmed}
                                        onChange={(e) => setAuthorityConfirmed(e.target.checked)}
                                        className={checkboxClasses}
                                        data-testid="authority-checkbox"
                                    />
                                    <span className="text-sm text-ink leading-snug">{AUTHORITY_CONSENT_TEXT}</span>
                                </label>

                                {/* Terms / Privacy / E-Signature consent */}
                                <div className="flex items-start gap-3 mb-5">
                                    <input
                                        id="terms-consent"
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className={checkboxClasses}
                                        data-testid="terms-checkbox"
                                    />
                                    <div className="text-sm text-ink leading-snug">
                                        <label htmlFor="terms-consent" className="cursor-pointer">{TERMS_CONSENT_TEXT}</label>
                                        <p className="mt-1 text-xs text-muted-ink">
                                            Read:{' '}
                                            <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-700">Terms of Service</a>
                                            {' · '}
                                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-700">Privacy Policy</a>
                                            {' · '}
                                            <a href="/esignature-consent" target="_blank" rel="noopener noreferrer" className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-700">E-Signature Consent</a>
                                            {' · '}
                                            <a href="/standard-nda" target="_blank" rel="noopener noreferrer" className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-700">Standard NDA</a>
                                        </p>
                                    </div>
                                </div>

                                <h2 className="font-display text-sm font-semibold text-gray-700 mb-3">Your Signature</h2>

                                {/* Form Fields */}
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className={labelClasses}>Full Name *</label>
                                        <input
                                            type="text"
                                            value={signature.name}
                                            onChange={(e) => setSignature({ ...signature, name: e.target.value })}
                                            className={inputClassesCrisp}
                                            placeholder="Your full name"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClasses}>Title *</label>
                                        <input
                                            type="text"
                                            value={signature.title}
                                            onChange={(e) => setSignature({ ...signature, title: e.target.value })}
                                            className={inputClassesCrisp}
                                            placeholder="e.g. CEO, CTO, Director"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClasses}>Date</label>
                                        <input
                                            type="date"
                                            value={signature.date}
                                            onChange={(e) => setSignature({ ...signature, date: e.target.value })}
                                            className={`${inputClassesCrisp} font-doc-mono`}
                                        />
                                    </div>
                                </div>

                                {/* Signature Mode Tabs */}
                                <div className="flex gap-1 mb-3 border-b border-line">
                                    {(['type', 'draw', 'upload'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setSignatureMode(mode)}
                                            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors duration-200 cursor-pointer ${
                                                signatureMode === mode
                                                    ? 'text-teal-800 border-b-2 border-teal-800 -mb-px'
                                                    : 'text-gray-500 hover:text-ink'
                                            }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>

                                {/* Signature Capture Area */}
                                <div className="mb-5 flex flex-col">
                                    {signatureMode === 'type' && (
                                        <div className="flex flex-col gap-3">
                                            <input
                                                type="text"
                                                value={typedSignature}
                                                onChange={(e) => handleTypedChange(e.target.value)}
                                                className={inputClassesCrisp}
                                                data-testid="signature-input"
                                                placeholder="Type your name to generate signature"
                                            />
                                            {typedSignature && (
                                                <div className="p-4 border border-line rounded-control bg-white flex items-center justify-center min-h-[80px]">
                                                    <p className={`${greatVibes.className} text-3xl text-gray-900 text-center break-words`}>{typedSignature}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {signatureMode === 'draw' && (
                                        <div className="flex flex-col gap-2">
                                            <canvas
                                                aria-label="Signature pad: draw your signature"
                                                ref={canvasRef}
                                                width={400}
                                                height={150}
                                                onPointerDown={startDrawing}
                                                onPointerMove={draw}
                                                onPointerUp={stopDrawing}
                                                onPointerCancel={stopDrawing}
                                                onPointerLeave={stopDrawing}
                                                className="w-full border border-line rounded-control cursor-crosshair bg-white touch-none"
                                            />
                                            <button
                                                onClick={clearCanvas}
                                                className="text-sm text-gray-500 hover:text-ink underline self-start cursor-pointer transition-colors duration-200"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    )}

                                    {signatureMode === 'upload' && (
                                        <div className="flex flex-col gap-3">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="w-full px-3 py-2 border border-line rounded-control text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-control file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-teal-800 hover:file:bg-gray-200 cursor-pointer"
                                            />
                                            {signatureImage && (
                                                <div className="p-4 border border-line rounded-control bg-white flex items-center justify-center min-h-[80px]">
                                                    <img src={signatureImage} alt="Signature" className="max-h-32 mx-auto" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-control text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                {!hasScrolledToBottom && (
                                    <p className="mb-3 text-xs font-medium text-amber-700" role="status">
                                        <span className="lg:hidden">Open &ldquo;Read the full NDA&rdquo; above and scroll to the end to sign.</span>
                                        <span className="hidden lg:inline">Scroll to the end of the document to sign.</span>
                                    </p>
                                )}

                                {/* Not-legal-advice notice in full form, above and below the sign button (as before the redesign) */}
                                <LegalDisclaimer className="mb-4 rounded-sheet! shadow-none! border-line!" />

                                {/* Submit Button */}
                                <Button
                                    shape="crisp"
                                    size="lg"
                                    onClick={handleSubmit}
                                    disabled={loading || !authorityConfirmed || !termsAccepted || !hasScrolledToBottom}
                                    className="w-full"
                                >
                                    {loading ? 'Submitting...' : 'Submit Signature'}
                                </Button>

                                <LegalDisclaimer className="mt-4 rounded-sheet! shadow-none! border-line!" />
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

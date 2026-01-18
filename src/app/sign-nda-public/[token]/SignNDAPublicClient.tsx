'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Great_Vibes } from 'next/font/google';

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
    const [isDrawing, setIsDrawing] = useState(false);
    const [typedSignature, setTypedSignature] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string>(initialHtml);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const documentRef = useRef<HTMLDivElement>(null);

    // Set initial HTML on mount
    useEffect(() => {
        console.log('🎨 Initial HTML loaded from server');
        setPreviewHtml(initialHtml);
    }, [initialHtml]);

    // Canvas drawing handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
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

        console.log('🔄 Updating preview HTML, signatureImage exists:', !!signatureImage, 'signerRole:', signerRole);

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
                console.log(`✅ Signature injected using Professional template pattern (${signatureBoxId})`);
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
                    console.log(`✅ Signature injected into sign-box ${signatureBoxIndex}`);
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
                    console.log('✅ Signature injected using Fallback pattern');
                }
            }

            if (!injected) {
                console.warn('⚠️ Could not find signature placeholder in HTML template');
            }

            setPreviewHtml(updatedHtml);
        }
    }, [signatureImage, previewHtml, signerRole]);

    // Check if scrolled to bottom
    const handleScroll = () => {
        if (!documentRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = documentRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            setHasScrolledToBottom(true);
        }
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

        if (!signature.name || !signature.title) {
            setError('Please fill in all required fields');
            return;
        }

        if (!signatureImage) {
            setError('Please provide a signature');
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
                }),
            });

            const result = await response.json();

            if (!response.ok) {
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



    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Main Container with Fixed Layout */}
            <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
                {/* LEFT SIDE: Signature Form (No Scroll) */}
                <div className="w-full lg:w-[45%] h-full overflow-hidden bg-gray-50 flex flex-col">
                    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4">
                        <div className="mb-3">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign NDA</h1>
                            <p className="text-gray-600 text-sm">{ndaTitle}</p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col flex-1 min-h-0 overflow-y-auto">
                            <h2 className="text-lg font-bold text-gray-900 mb-3">Your Signature</h2>

                            {/* Form Fields */}
                            <div className="space-y-3 mb-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={signature.name}
                                        onChange={(e) => setSignature({ ...signature, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                                        placeholder="Your full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={signature.title}
                                        onChange={(e) => setSignature({ ...signature, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                                        placeholder="Your title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={signature.date}
                                        onChange={(e) => setSignature({ ...signature, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Signature Mode Tabs */}
                            <div className="flex gap-2 mb-3 border-b border-gray-200">
                                <button
                                    onClick={() => setSignatureMode('type')}
                                    className={`px-4 py-2 text-sm font-semibold transition-all ${signatureMode === 'type'
                                        ? 'text-teal-600 border-b-2 border-teal-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Type
                                </button>
                                <button
                                    onClick={() => setSignatureMode('draw')}
                                    className={`px-4 py-2 text-sm font-semibold transition-all ${signatureMode === 'draw'
                                        ? 'text-teal-600 border-b-2 border-teal-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Draw
                                </button>
                                <button
                                    onClick={() => setSignatureMode('upload')}
                                    className={`px-4 py-2 text-sm font-semibold transition-all ${signatureMode === 'upload'
                                        ? 'text-teal-600 border-b-2 border-teal-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Upload
                                </button>
                            </div>

                            {/* Signature Capture Area */}
                            <div className="mb-3 flex-1 min-h-0 flex flex-col">
                                {signatureMode === 'type' && (
                                    <div className="flex-1 flex flex-col">
                                        <input
                                            type="text"
                                            value={typedSignature}
                                            onChange={(e) => handleTypedChange(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                                            placeholder="Type your name"
                                        />
                                        {typedSignature && (
                                            <div className="p-3 border-2 border-gray-300 rounded bg-white overflow-hidden flex items-center justify-center flex-1">
                                                <p className={`${greatVibes.className} text-3xl text-center break-words`}>{typedSignature}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {signatureMode === 'draw' && (
                                    <div className="flex-1 flex flex-col">
                                        <canvas
                                            ref={canvasRef}
                                            width={400}
                                            height={150}
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                            className="w-full border-2 border-gray-300 rounded cursor-crosshair bg-white flex-1"
                                        />
                                        <button
                                            onClick={clearCanvas}
                                            className="mt-1 text-sm text-gray-600 hover:text-gray-900 underline self-start"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}

                                {signatureMode === 'upload' && (
                                    <div className="flex-1 flex flex-col">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="w-full px-3 py-2 border border-gray-300 rounded"
                                        />
                                        {signatureImage && (
                                            <div className="mt-2 p-3 border-2 border-gray-300 rounded bg-white flex items-center justify-center flex-1">
                                                <img src={signatureImage} alt="Signature" className="max-h-32 mx-auto" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-auto"
                            >
                                {loading ? 'Submitting...' : 'Submit Signature'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Document Preview (Full Window Height) */}
                <div
                    ref={documentRef}
                    onScroll={handleScroll}
                    className="hidden lg:block w-[55%] h-full bg-white border-l border-gray-200 overflow-y-auto"
                >
                    <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-3 z-10">
                        <h3 className="font-semibold text-gray-900 text-sm">Document Preview</h3>
                    </div>
                    <div className="p-6">
                        {previewHtml ? (
                            <iframe
                                srcDoc={previewHtml}
                                className="w-full border-0"
                                style={{ minHeight: '1200px', height: 'auto' }}
                                title="NDA Preview"
                                sandbox="allow-same-origin allow-scripts"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-64">
                                <p className="text-gray-500">Loading preview...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

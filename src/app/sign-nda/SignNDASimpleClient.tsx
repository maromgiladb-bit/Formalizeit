"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Great_Vibes } from 'next/font/google';
import PublicToolbar from '@/components/PublicToolbar';

const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-great-vibes',
});

export default function SignNDASimpleClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDev = searchParams.get('dev') === 'true';

  const [ndaData, setNdaData] = useState<{
    draftId: string;
    values: Record<string, string | boolean>;
    htmlContent: string;
    partyAEmail: string;
    partyAName: string;
    partyBEmail: string;
    partyBName: string;
  } | null>(null);

  const [partyASignature, setPartyASignature] = useState({
    name: "",
    title: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('type');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedSignature, setTypedSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const documentRef = useRef<HTMLDivElement>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [showSendModal, setShowSendModal] = useState(false);
  const [partyBInfo, setPartyBInfo] = useState({ email: '', name: '' });

  // Load data from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem('ndaSignData');
    if (stored) {
      const parsed = JSON.parse(stored);
      setNdaData(parsed);
      setPreviewHtml(parsed.htmlContent); // Initialize preview HTML
      setPartyASignature(prev => ({ ...prev, name: parsed.partyAName || "" }));
      setTypedSignature(parsed.partyAName || "");
      if (parsed.partyBEmail && parsed.partyBName) {
        setPartyBInfo({ email: parsed.partyBEmail, name: parsed.partyBName });
      }
    }
  }, []);

  // Update preview HTML when signature changes
  useEffect(() => {
    if (!ndaData?.htmlContent) return;

    console.log('🔄 Updating preview HTML, signatureImage exists:', !!signatureImage);

    let updatedHtml = ndaData.htmlContent;

    // If we have a signature, inject it into the HTML
    if (signatureImage) {
      let injected = false;

      // Try different template patterns in order of specificity

      // Pattern 1: Professional template - <div class="sign-box" id="party-a-signature">
      const professionalPattern = /(<div class="sign-box" id="party-a-signature">)([\s\S]*?)(<\/div>)/;
      if (professionalPattern.test(updatedHtml)) {
        updatedHtml = updatedHtml.replace(
          professionalPattern,
          `$1<img src="${signatureImage}" alt="Signature" style="max-height: 70px; max-width: 100%; display: block; margin: auto;" />$3`
        );
        injected = true;
        console.log('✅ Signature injected using Professional template pattern');
      }

      // Pattern 2: Basic mutual_nda_v1 template - <div class="line"></div>
      if (!injected) {
        const linePattern = /(<div class="line">)(<\/div>)/;
        if (linePattern.test(updatedHtml)) {
          updatedHtml = updatedHtml.replace(
            linePattern,
            `$1<img src="${signatureImage}" alt="Signature" style="max-height: 50px; display: block; margin: 4px 0;" />$2`
          );
          injected = true;
          console.log('✅ Signature injected using Basic template pattern');
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
        console.log('📄 HTML preview of first 500 chars:', updatedHtml.substring(0, 500));
      }
    }

    setPreviewHtml(updatedHtml);
  }, [signatureImage, partyASignature, ndaData]);

  // Check if scrolled to bottom
  const handleScroll = () => {
    if (!documentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = documentRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setHasScrolledToBottom(true);
    }
  };

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
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureImage(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImage(null);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSignatureImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Generate typed signature image
  useEffect(() => {
    if (signatureMode === 'type' && typedSignature) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '48px Great Vibes';
      ctx.fillStyle = '#000';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedSignature, 20, 50);

      setSignatureImage(canvas.toDataURL());
    }
  }, [typedSignature, signatureMode]);

  // Submit signature
  const handleSubmit = async () => {
    if (!ndaData) {
      setErrorMessage("NDA data not found");
      return;
    }

    if (!hasScrolledToBottom) {
      setErrorMessage("Please read the entire document before signing");
      return;
    }

    if (!signatureImage) {
      setErrorMessage("Please provide a signature");
      return;
    }

    if (!partyASignature.name || !partyASignature.title) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    setSubmitStatus('submitting');
    setErrorMessage("");

    try {
      const response = await fetch('/api/ndas/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: ndaData.draftId,
          signerEmail: ndaData.partyAEmail,
          signerName: partyASignature.name,
          signerTitle: partyASignature.title,
          signatureImage: signatureImage,
          signatureDate: partyASignature.date,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit signature');
      }

      setSubmitStatus('success');
      setTimeout(() => {
        router.push('/sign-nda/success');
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit signature');
    }
  };

  // Generate and save PDF
  const handleGenerateAndSave = async () => {
    if (!ndaData) {
      setErrorMessage("NDA data not found");
      return;
    }

    if (!partyASignature.name || !partyASignature.title) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    setSubmitStatus('submitting');
    setErrorMessage("");

    try {
      // Prepare form data with all NDA values and signatures
      const formData = {
        ...ndaData.values,
        party_1_name: ndaData.partyAName,
        party_1_signatory_name: partyASignature.name,
        party_1_signatory_title: partyASignature.title,
        party_2_name: ndaData.partyBName,
      };

      const response = await fetch('/api/ndas/generate-and-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: ndaData.draftId,
          formData: formData,
          signatureImage: signatureImage,
          signerName: partyASignature.name,
          signerTitle: partyASignature.title,
          signerDate: partyASignature.date,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate and save PDF');
      }

      setSubmitStatus('success');
      setTimeout(() => {
        router.push('/sign-nda/success');
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate and save PDF');
    }
  };

  // Preview PDF (dev purposes - doesn't save)
  const handlePreviewPdf = async () => {
    if (!ndaData) {
      setErrorMessage("NDA data not found");
      return;
    }

    try {
      // Prepare form data
      const formData = {
        ...ndaData.values,
        party_1_name: ndaData.partyAName,
        party_1_signatory_name: partyASignature.name || 'John Doe',
        party_1_signatory_title: partyASignature.title || 'CEO',
        party_2_name: ndaData.partyBName,
      };

      const response = await fetch('/api/ndas/preview-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: formData,
          signatureImage: signatureImage,
          signerName: partyASignature.name || 'John Doe',
          signerTitle: partyASignature.title || 'CEO',
          signerDate: partyASignature.date,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview PDF');
      }

      // Get the PDF blob and open in new tab
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Preview PDF error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to preview PDF');
    }
  };

  // Send NDA via email
  const handleSendNDA = async () => {
    if (!ndaData) {
      setErrorMessage("NDA data not found");
      return;
    }

    if (!partyASignature.name || !partyASignature.title) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    if (!signatureImage) {
      setErrorMessage("Please provide a signature");
      return;
    }

    if (!partyBInfo.email || !partyBInfo.name) {
      setErrorMessage("Please provide Party B email and name");
      return;
    }

    setSubmitStatus('submitting');
    setErrorMessage("");

    try {
      const formData = {
        ...ndaData.values,
        party_1_name: ndaData.partyAName,
        party_1_signatory_name: partyASignature.name,
        party_1_signatory_title: partyASignature.title,
        party_2_name: partyBInfo.name,
      };

      const response = await fetch('/api/ndas/send-for-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: ndaData.draftId,
          partyBEmail: partyBInfo.email,
          partyBName: partyBInfo.name,
          signatureImage,
          signerName: partyASignature.name,
          signerTitle: partyASignature.title,
          signerDate: partyASignature.date,
          formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send NDA');
      }

      setSubmitStatus('success');
      setShowSendModal(false);
      setTimeout(() => {
        router.push('/sign-nda/success');
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send NDA');
    }
  };

  if (!ndaData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No NDA Data Found</h2>
          <p className="text-gray-600 mb-6">Please return to the NDA creation page.</p>
          <button
            onClick={() => router.push('/fillndahtml')}
            className="px-6 py-3 bg-[var(--teal-600)] text-white rounded-xl font-bold hover:bg-[var(--teal-700)] transition-all"
          >
            Go to NDA Creation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-none">
        <PublicToolbar />
      </div>

      {/* Main Container with Fixed Layout */}
      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
        {/* LEFT SIDE: Signature Form (Ultra Compact - No Scroll) */}
        <div className="w-full lg:w-[45%] h-full overflow-hidden bg-gray-50 flex flex-col">
          <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-3">
            <div className="mb-2">
              <h1 className="text-xl font-bold text-gray-900 mb-0.5">Sign NDA</h1>
              <p className="text-gray-600 text-xs">Review and sign your agreement</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col flex-1 min-h-0">
              <h2 className="text-base font-bold text-gray-900 mb-2">Your Signature</h2>

              {/* Form Fields */}
              <div className="space-y-1.5 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Name *</label>
                  <input
                    type="text"
                    value={partyASignature.name}
                    onChange={(e) => setPartyASignature(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--teal-600)] focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Title *</label>
                  <input
                    type="text"
                    value={partyASignature.title}
                    onChange={(e) => setPartyASignature(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--teal-600)] focus:border-transparent"
                    placeholder="Your title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Date</label>
                  <input
                    type="date"
                    value={partyASignature.date}
                    onChange={(e) => setPartyASignature(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[var(--teal-600)] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Signature Mode Tabs */}
              <div className="flex gap-1.5 mb-2 border-b border-gray-200">
                <button
                  onClick={() => setSignatureMode('type')}
                  className={`px-2 py-1 text-xs font-semibold transition-all ${signatureMode === 'type'
                    ? 'text-[var(--teal-600)] border-b-2 border-[var(--teal-600)]'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Type
                </button>
                <button
                  onClick={() => setSignatureMode('draw')}
                  className={`px-2 py-1 text-xs font-semibold transition-all ${signatureMode === 'draw'
                    ? 'text-[var(--teal-600)] border-b-2 border-[var(--teal-600)]'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Draw
                </button>
                <button
                  onClick={() => setSignatureMode('upload')}
                  className={`px-2 py-1 text-xs font-semibold transition-all ${signatureMode === 'upload'
                    ? 'text-[var(--teal-600)] border-b-2 border-[var(--teal-600)]'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Upload
                </button>
              </div>

              {/* Signature Capture Area */}
              <div className="mb-2 flex-1 min-h-0 flex flex-col">
                {signatureMode === 'type' && (
                  <div className="flex-1 flex flex-col">
                    <input
                      type="text"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      className="w-full p-1.5 text-xs border border-gray-300 rounded mb-1.5"
                      placeholder="Type your name"
                    />
                    {typedSignature && (
                      <div className="p-2 border-2 border-gray-300 rounded bg-white overflow-hidden flex items-center justify-center flex-1">
                        <p className={`${greatVibes.className} text-2xl text-center break-words`}>{typedSignature}</p>
                      </div>
                    )}
                  </div>
                )}

                {signatureMode === 'draw' && (
                  <div className="flex-1 flex flex-col">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={80}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="w-full border-2 border-gray-300 rounded cursor-crosshair bg-white flex-1"
                    />
                    <button
                      onClick={clearCanvas}
                      className="mt-0.5 text-[10px] text-gray-600 hover:text-gray-900 underline self-start"
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
                      onChange={handleFileUpload}
                      className="w-full p-1.5 text-xs border border-gray-300 rounded"
                    />
                    {signatureImage && (
                      <div className="mt-1.5 p-2 border-2 border-gray-300 rounded bg-white flex items-center justify-center flex-1">
                        <img src={signatureImage} alt="Signature" className="max-h-20 mx-auto" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-1.5 p-1.5 bg-red-50 border border-red-200 rounded text-red-800 text-[10px]">
                  {errorMessage}
                </div>
              )}

              {/* Success Message */}
              {submitStatus === 'success' && (
                <div className="mb-1.5 p-1.5 bg-green-50 border border-green-200 rounded text-green-800 text-[10px]">
                  ✓ Submitted! Redirecting...
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-1.5 mt-auto pt-1.5">
                <button
                  onClick={() => router.back()}
                  className="flex-1 px-3 py-1.5 text-xs border-2 border-gray-300 text-gray-700 rounded font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                {isDev && (
                  <button
                    onClick={handlePreviewPdf}
                    className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-all"
                  >
                    Preview PDF
                  </button>
                )}
                <button
                  onClick={handleGenerateAndSave}
                  disabled={submitStatus === 'submitting'}
                  className="flex-1 px-3 py-1.5 text-xs bg-[var(--teal-600)] text-white rounded font-bold hover:bg-[var(--teal-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitStatus === 'submitting' ? 'Generating...' : 'Generate & Save PDF'}
                </button>
                <button
                  onClick={() => setShowSendModal(true)}
                  disabled={submitStatus === 'submitting' || !signatureImage}
                  className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Send NDA
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Document Preview (Full Window Height) */}
        <div
          ref={documentRef}
          onScroll={handleScroll}
          className="hidden lg:block w-[55%] h-full bg-white border-l border-gray-200 overflow-y-auto"
        >
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 z-10">
            <h3 className="font-semibold text-gray-900 text-sm">Document Preview</h3>
            {!hasScrolledToBottom && (
              <p className="text-[10px] text-yellow-600">⚠️ Scroll to bottom to sign</p>
            )}
            {hasScrolledToBottom && (
              <p className="text-[10px] text-green-600">✓ Ready to sign</p>
            )}
          </div>
          <div className="p-6">
            <iframe
              srcDoc={previewHtml}
              className="w-full border-0"
              style={{ minHeight: '1200px', height: 'auto' }}
              title="NDA Preview"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      </div>

      {/* Send NDA Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm & Send NDA</h2>
            <p className="text-gray-600 mb-6">Review the recipient details below and send for signature.</p>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="mb-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Recipient Name</label>
                  <p className="font-semibold text-gray-900">{partyBInfo.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Email Address</label>
                  <p className="font-semibold text-gray-900">{partyBInfo.email}</p>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setErrorMessage('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNDA}
                disabled={submitStatus === 'submitting'}
                className="flex-1 px-4 py-3 bg-[var(--teal-600)] text-white rounded-lg font-bold hover:bg-[var(--teal-700)] disabled:opacity-50 transition-all shadow-md"
              >
                {submitStatus === 'submitting' ? 'Sending...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';
import PrivateToolbar from '@/components/PrivateToolbar';
import { useUser, RedirectToSignIn } from '@clerk/nextjs';

interface EmailTemplate {
    id: string;
    name: string;
    description: string;
}

const emailTemplates: EmailTemplate[] = [
    {
        id: 'recipientEdit',
        name: '#1 - New NDA for Review (Party B)',
        description: 'Sent to Party B when invited to review and edit an NDA',
    },
    {
        id: 'ownerReview',
        name: '#2 - Review Changes (Party A)',
        description: 'Sent to Party A when Party B submits changes for review',
    },
    {
        id: 'timeToSign',
        name: '#3 - Time to Sign',
        description: 'Sent when the other party has signed and it\'s your turn, or when NDA is ready for signature',
    },
    {
        id: 'congratulations',
        name: '#4 - Congratulations - All Done',
        description: 'Sent to both parties when signing process is complete',
    },
];

export default function DevEmailsPage() {
    const { isLoaded, user } = useUser();
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [previewHtml, setPreviewHtml] = useState('');
    const [loading, setLoading] = useState(false);

    const loadEmailPreview = async (templateId: string) => {
        setLoading(true);
        setSelectedTemplate(templateId);

        try {
            const response = await fetch('/api/dev/email-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId }),
            });

            if (!response.ok) throw new Error('Failed to load email preview');

            const data = await response.json();
            setPreviewHtml(data.html);
        } catch (err) {
            console.error('Failed to load email preview:', err);
            setPreviewHtml('<div style="padding: 20px; color: red;">Failed to load email preview</div>');
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) return <div className="min-h-screen">Loading...</div>;
    if (!user) return <RedirectToSignIn />;

    return (
        <div className="min-h-screen bg-gray-50">
            <PrivateToolbar />

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        📧 Dev Email Templates
                    </h1>
                    <p className="text-gray-600">
                        Preview all email templates for testing (Development Only)
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Email Templates List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {emailTemplates.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`p-4 cursor-pointer transition-colors ${selectedTemplate === template.id
                                            ? 'bg-purple-50 border-l-4 border-l-purple-500'
                                            : 'hover:bg-gray-50'
                                            }`}
                                        onClick={() => loadEmailPreview(template.id)}
                                    >
                                        <h3 className="font-semibold text-gray-900">
                                            {template.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {template.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {selectedTemplate
                                            ? `Preview: ${emailTemplates.find(t => t.id === selectedTemplate)?.name}`
                                            : 'Select an email template'}
                                    </h2>
                                    {selectedTemplate && previewHtml && (
                                        <button
                                            onClick={() => {
                                                const blob = new Blob([previewHtml], { type: 'text/html' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `${selectedTemplate}_email.html`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                                        >
                                            Download HTML
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-4">
                                {!selectedTemplate ? (
                                    <div className="text-center py-20 text-gray-400">
                                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <p>Select an email template to preview</p>
                                    </div>
                                ) : loading ? (
                                    <div className="text-center py-20">
                                        <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                                        <p className="mt-4 text-gray-600">Loading preview...</p>
                                    </div>
                                ) : previewHtml ? (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                                            <span className="text-sm font-medium text-gray-700">Email Preview</span>
                                        </div>
                                        <div
                                            className="bg-gray-200 p-6"
                                            style={{ minHeight: '500px' }}
                                        >
                                            <div
                                                className="bg-white shadow-lg rounded-lg overflow-hidden max-w-2xl mx-auto"
                                                dangerouslySetInnerHTML={{ __html: previewHtml }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-20 text-red-500">
                                        <p>Failed to load preview</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

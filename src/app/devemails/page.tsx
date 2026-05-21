'use client';
import { useState } from 'react';
import PrivateToolbar from '@/components/PrivateToolbar';
import { useUser, RedirectToSignIn } from '@clerk/nextjs';
import { Mail, Download, ChevronRight, Eye } from 'lucide-react';

interface EmailTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
}

const emailTemplates: EmailTemplate[] = [
    // Party B flow
    {
        id: 'recipientEdit',
        name: 'New NDA for Review',
        description: 'Party B receives NDA to review with a message from sender',
        category: 'Party B receives',
    },
    {
        id: 'recipientEditNoMessage',
        name: 'New NDA for Review (no message)',
        description: 'Party B receives NDA to review, no sender message',
        category: 'Party B receives',
    },
    {
        id: 'inputRequest',
        name: 'Input Request',
        description: 'Party B asked to fill in specific fields',
        category: 'Party B receives',
    },
    {
        id: 'recipientSignRequest',
        name: 'Signature Request',
        description: 'Party B invited to sign the reviewed NDA',
        category: 'Party B receives',
    },
    {
        id: 'partyARequestChanges',
        name: 'Changes Requested by Party A',
        description: 'Party A sends Party B back for revisions with feedback',
        category: 'Party B receives',
    },
    // Party A flow
    {
        id: 'partyBSuggestions',
        name: 'Party B Suggested Changes',
        description: 'Party B proposed edits, Party A reviews them',
        category: 'Party A receives',
    },
    {
        id: 'ownerReview',
        name: 'Review Changes (Revision)',
        description: 'Party A sees before/after diff of suggested changes',
        category: 'Party A receives',
    },
    {
        id: 'recipientInputSubmitted',
        name: 'Details Submitted (No Changes)',
        description: 'Party B filled in fields without suggesting changes',
        category: 'Party A receives',
    },
    // Signing
    {
        id: 'timeToSign',
        name: 'Your Turn to Sign',
        description: 'Other party already signed, your turn now',
        category: 'Signing',
    },
    {
        id: 'congratulations',
        name: 'NDA Complete',
        description: 'Both parties signed, PDF ready for download',
        category: 'Signing',
    },
    {
        id: 'finalSigned',
        name: 'Fully Signed (Legacy)',
        description: 'Alternate completion email with download link',
        category: 'Signing',
    },
    // Internal / Team
    {
        id: 'approvalRequest',
        name: 'Draft Awaiting Approval',
        description: 'Contributor submitted draft, approver needs to review',
        category: 'Internal',
    },
    {
        id: 'approvalApproved',
        name: 'Draft Approved',
        description: 'Approver approved the draft, ready to send',
        category: 'Internal',
    },
    {
        id: 'approvalRejected',
        name: 'Changes Requested on Draft',
        description: 'Approver rejected draft with feedback',
        category: 'Internal',
    },
    {
        id: 'invite',
        name: 'Team Invite (Approver)',
        description: 'Invite to join organization as Approver',
        category: 'Internal',
    },
    {
        id: 'inviteContributor',
        name: 'Team Invite (Contributor)',
        description: 'Invite to join organization as Contributor',
        category: 'Internal',
    },
];

const categories = ['Party B receives', 'Party A receives', 'Signing', 'Internal'];

interface EmailMeta {
    html: string;
    subject: string;
    from: string;
    to: string;
}

export default function DevEmailsPage() {
    const { isLoaded, user } = useUser();
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [emailMeta, setEmailMeta] = useState<EmailMeta | null>(null);
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
            setEmailMeta(data);
        } catch (err) {
            console.error('Failed to load email preview:', err);
            setEmailMeta({
                html: '<div style="padding: 20px; color: red;">Failed to load email preview</div>',
                subject: '',
                from: '',
                to: '',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) return <div className="min-h-screen">Loading...</div>;
    if (!user) return <RedirectToSignIn />;

    const selectedInfo = emailTemplates.find(t => t.id === selectedTemplate);

    return (
        <div className="min-h-screen bg-gray-50">
            <PrivateToolbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="mb-8">
                    <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">Development</p>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Email Templates</h1>
                    <p className="text-sm text-gray-500">Preview all {emailTemplates.length} email templates with sample data</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {categories.map((category, catIdx) => {
                                const templates = emailTemplates.filter(t => t.category === category);
                                return (
                                    <div key={category}>
                                        <div className={`px-4 py-2.5 bg-gray-50 ${catIdx > 0 ? 'border-t border-gray-200' : ''}`}>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{category}</p>
                                        </div>
                                        {templates.map((template) => (
                                            <button
                                                key={template.id}
                                                className={`w-full text-left px-4 py-3 border-t border-gray-100 transition-colors cursor-pointer ${
                                                    selectedTemplate === template.id
                                                        ? 'bg-teal-50 border-l-2 border-l-teal-700'
                                                        : 'hover:bg-gray-50'
                                                }`}
                                                onClick={() => loadEmailPreview(template.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-semibold truncate ${
                                                            selectedTemplate === template.id ? 'text-teal-800' : 'text-gray-900'
                                                        }`}>
                                                            {template.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{template.description}</p>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ml-2 ${
                                                        selectedTemplate === template.id ? 'text-teal-700' : 'text-gray-300'
                                                    }`} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Preview header */}
                            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm font-semibold text-gray-900">
                                        {selectedInfo ? selectedInfo.name : 'Select a template'}
                                    </p>
                                </div>
                                {selectedTemplate && emailMeta?.html && (
                                    <button
                                        onClick={() => {
                                            const blob = new Blob([emailMeta.html], { type: 'text/html' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${selectedTemplate}_email.html`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download HTML
                                    </button>
                                )}
                            </div>

                            {/* Preview body */}
                            <div className="p-4">
                                {!selectedTemplate ? (
                                    <div className="text-center py-24">
                                        <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                                            <Mail className="w-6 h-6 text-teal-700" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 mb-1">No template selected</p>
                                        <p className="text-xs text-gray-500">Choose a template from the sidebar to preview it</p>
                                    </div>
                                ) : loading ? (
                                    <div className="text-center py-24">
                                        <div className="animate-spin h-8 w-8 border-2 border-teal-700 border-t-transparent rounded-full mx-auto"></div>
                                        <p className="mt-3 text-sm text-gray-500">Loading preview...</p>
                                    </div>
                                ) : emailMeta?.html ? (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Email client-style header */}
                                        <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-1.5">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xs font-semibold text-gray-400 w-14 shrink-0">Subject</span>
                                                <span className="text-sm font-semibold text-gray-900">{emailMeta.subject}</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xs font-semibold text-gray-400 w-14 shrink-0">From</span>
                                                <span className="text-sm text-gray-700">{emailMeta.from}</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xs font-semibold text-gray-400 w-14 shrink-0">To</span>
                                                <span className="text-sm text-gray-700">{emailMeta.to}</span>
                                            </div>
                                        </div>
                                        {/* Browser chrome */}
                                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                            <span className="ml-3 text-xs text-gray-400">Email Preview</span>
                                        </div>
                                        {/* Email render */}
                                        <iframe
                                            srcDoc={emailMeta.html}
                                            className="w-full border-0"
                                            style={{ minHeight: '700px' }}
                                            title="Email preview"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center py-24 text-red-500">
                                        <p className="text-sm">Failed to load preview</p>
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

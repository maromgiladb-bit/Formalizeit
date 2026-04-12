import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Info } from 'lucide-react';
import SignNDAPublicClient from './SignNDAPublicClient';
import { renderNdaHtml } from '@/lib/renderNdaHtml';

const DEV_TEST_TOKEN = '00000000-0000-0000-0000-000000000001';

export default async function SignNDAPublicPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const isDev = process.env.NODE_ENV === 'development';

    // Dev mode: Use mock data for testing
    if (isDev && token === DEV_TEST_TOKEN) {
        const mockFormData = {
            templateId: 'professional_mutual_nda_v1',
            // Party 1 (Sender - Party A)
            party_1_name: 'Acme Corporation',
            party_1_address: '123 Main St, San Francisco, CA 94102',
            party_1_signatory_name: 'John Smith',
            party_1_signatory_title: 'CEO',
            party_1_phone: '+1 (555) 123-4567',
            party_1_emails_joined: 'john@acme.com',
            // Party 2 (Receiver - Party B)
            party_2_name: 'Tech Solutions Inc.',
            party_2_address: '456 Market St, San Francisco, CA 94103',
            party_2_signatory_name: 'Jane Doe',
            party_2_signatory_title: 'CTO',
            party_2_phone: '+1 (555) 987-6543',
            party_2_emails_joined: 'jane@techsolutions.com',
            // Document fields
            effective_date: new Date().toISOString().split('T')[0],
            effective_date_long: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            governing_law_full: 'California',
            purpose: 'evaluating a potential business relationship',
            information_scope_text: 'All information and materials',
            term_years_number: '2',
            term_years_words: 'two',
            additional_terms: 'No additional terms specified',
            doc_title: 'Mutual Non-Disclosure Agreement',
        };

        // Generate HTML server-side
        const initialHtml = await renderNdaHtml(mockFormData, 'professional_mutual_nda_v1');

        return (
            <SignNDAPublicClient
                signerId={DEV_TEST_TOKEN}
                signerEmail="jane@techsolutions.com"
                signerName="Jane Doe"
                ndaTitle="Sample NDA Agreement (Dev Mode)"
                formData={mockFormData}
                templateId="professional_mutual_nda_v1"
                initialHtml={initialHtml}
            />
        );
    }

    // Find signer by ID (using token as ID for now)
    const signer = await prisma.signer.findUnique({
        where: { id: token },
        include: {
            signRequest: {
                include: {
                    draft: true,
                    organization: true,
                },
            },
        },
    });

    if (!signer) {
        notFound();
    }

    // Check if already signed
    if (signer.status === 'SIGNED') {
        redirect(`/sign-nda-public/${signer.id}/success`);
    }

    // Check workflow state - Party B can sign when reviewing or when explicitly awaiting signature
    const draft = signer.signRequest.draft;
    const workflowState = (draft as typeof draft & { workflowState?: string }).workflowState || 'DRAFT';

    // Determine if this is Party A (APPROVER) or Party B (SIGNER)
    const isPartyA = signer.role === 'APPROVER';

    // Allow signing logic
    let canSign = false;

    if (isPartyA) {
        // Party A can sign when awaiting their signature OR when reviewing changes (approve & sign)
        canSign = ['AWAITING_PARTY_A_SIGNATURE', 'AWAITING_PARTY_A_REVIEW'].includes(workflowState);
    } else {
        // Party B can sign when reviewing or awaiting signature
        canSign = ['AWAITING_PARTY_B_REVIEW', 'AWAITING_PARTY_B_SIGNATURE'].includes(workflowState);
    }

    if (!canSign) {
        // Show appropriate message based on state
        let title = 'Not Ready for Signature';
        let message = 'This NDA is not ready for your signature yet.';

        if (workflowState === 'COMPLETE') {
            title = 'NDA Complete';
            message = 'This NDA has been fully signed by both parties.';
        } else if (isPartyA) {
            if (['AWAITING_PARTY_B_REVIEW', 'AWAITING_PARTY_B_SIGNATURE'].includes(workflowState)) {
                title = 'Waiting for Party B';
                message = 'Party B is currently reviewing or signing. You will be notified when it is your turn.';
            }
        } else {
            // Party B
            if (['AWAITING_PARTY_A_REVIEW', 'AWAITING_PARTY_A_SIGNATURE'].includes(workflowState)) {
                title = 'Waiting for Other Party';
                message = 'The other party is currently reviewing or signing. You will be notified when it is your turn.';
            }
        }

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Info className="w-6 h-6 text-teal-700" />
                    </div>
                    <h1 className="text-xl font-extrabold text-gray-900 mb-2">{title}</h1>
                    <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                </div>
            </div>
        );
    }

    const formData = (draft.content as Record<string, unknown>) || {};
    const templateId = (formData.templateId as string) || 'professional_mutual_nda_v1';

    // Determine signer role
    const signerRole = isPartyA ? 'partyA' : 'partyB';

    // Generate HTML server-side with proper field mappings
    // Include existing signatures from previous signers
    const templateData = {
        ...formData,
        // Map party_a fields to party_1 for template compatibility
        party_1_name: formData.party_a_name || '',
        party_1_address: formData.party_a_address || '',
        party_1_signatory_name: formData.party_a_signatory_name || '',
        party_1_signatory_title: formData.party_a_title || '',
        party_1_phone: formData.party_a_phone || '',
        party_1_emails_joined: formData.party_a_email || '',
        // Include existing Party A signature if present
        party_1_signature_image: formData.party_1_signature_image || '',
        // Map party_b fields to party_2 for template compatibility
        party_2_name: formData.party_b_name || '',
        party_2_address: formData.party_b_address || '',
        party_2_signatory_name: formData.party_b_signatory_name || '',
        party_2_signatory_title: formData.party_b_title || '',
        party_2_phone: formData.party_b_phone || '',
        party_2_emails_joined: formData.party_b_email || '',
        // Include existing Party B signature if present
        party_2_signature_image: formData.party_2_signature_image || '',
        // Additional computed fields
        effective_date_long: formData.effective_date ? new Date(formData.effective_date as string).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '',
        governing_law_full: formData.governing_law || '',
        term_years_number: formData.term_months ? Math.floor(parseInt(formData.term_months as string) / 12) : '',
        term_years_words: formData.term_months ? (Math.floor(parseInt(formData.term_months as string) / 12) === 1 ? 'one' : 'two') : '',
        purpose: 'evaluating a potential business relationship',
        information_scope_text: 'All information and materials',
    };
    const initialHtml = await renderNdaHtml(templateData, templateId);

    return (
        <SignNDAPublicClient
            signerId={signer.id}
            signerEmail={signer.email}
            signerName={signer.name || ''}
            ndaTitle={draft.title || 'Untitled NDA'}
            formData={formData}
            templateId={templateId}
            initialHtml={initialHtml}
            signerRole={signerRole}
        />
    );
}

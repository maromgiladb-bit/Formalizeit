import FillNDAPublicClient from '../[token]/FillNDAPublicClient';

/**
 * Dev-only test page for FillNDAPublicClient
 * Access at: /fillndahtml-public/dev
 */
export default function FillNDAPublicDevPage() {
    // Mock data for testing - includes all fields like fillndahtml
    const mockFormData = {
        // Document details
        docName: "Partnership NDA Agreement",
        effective_date: new Date().toISOString().slice(0, 10),
        term_months: "24",
        confidentiality_period_months: "36",
        // Party A
        party_a_name: "Acme Corporation",
        party_a_address: "123 Business Street, San Francisco, CA 94105",
        party_a_phone: "+1-555-123-4567",
        party_a_signatory_name: "John Smith",
        party_a_title: "CEO",
        party_a_email: "party-a@example.com",
        // Party B (empty - to be filled by user)
        party_b_name: "",
        party_b_address: "",
        party_b_phone: "",
        party_b_signatory_name: "",
        party_b_title: "",
        party_b_email: "",
        // Clauses
        governing_law: "State of California",
        ip_ownership: "Each party retains ownership of their respective intellectual property. Any jointly developed IP shall be owned equally.",
        non_solicit: "Neither party shall solicit employees of the other party during the term and for 12 months after termination.",
        exclusivity: "This is a non-exclusive agreement. Both parties may enter similar agreements with third parties.",
        additional_terms: "",
    };

    const mockPendingInputFields = [
        "party_b_name",
        "party_b_address",
        "party_b_phone",
        "party_b_signatory_name",
        "party_b_title",
        "party_b_email",
    ];

    const mockFieldStates = {
        // Document - readonly
        docName: "readonly" as const,
        effective_date: "readonly" as const,
        term_months: "readonly" as const,
        confidentiality_period_months: "readonly" as const,
        // Party A - readonly
        party_a_name: "readonly" as const,
        party_a_address: "readonly" as const,
        party_a_phone: "readonly" as const,
        party_a_signatory_name: "readonly" as const,
        party_a_title: "readonly" as const,
        party_a_email: "readonly" as const,
        // Party B - editable
        party_b_name: "editable" as const,
        party_b_address: "editable" as const,
        party_b_phone: "editable" as const,
        party_b_signatory_name: "editable" as const,
        party_b_title: "editable" as const,
        party_b_email: "editable" as const,
        // Clauses - readonly
        governing_law: "readonly" as const,
        ip_ownership: "readonly" as const,
        non_solicit: "readonly" as const,
        exclusivity: "readonly" as const,
        additional_terms: "readonly" as const,
    };

    const mockHtml = `
        <html>
            <body style="font-family: system-ui; padding: 40px; max-width: 800px; margin: 0 auto;">
                <h1 style="text-align: center; color: #333;">NDA Preview</h1>
                <p style="color: #666; text-align: center;">This is a dev preview. Fill in the form to see it update.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
                <p>Between <strong>Acme Corporation</strong> and <strong>[Party B Name]</strong></p>
                <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Term:</strong> 24 months</p>
                <p><strong>Governing Law:</strong> State of California</p>
            </body>
        </html>
    `;

    return (
        <FillNDAPublicClient
            signerId="00000000-0000-0000-0000-000000000001"
            signerEmail="test@example.com"
            signerName="Test User"
            ndaTitle="[DEV] Partnership NDA Agreement"
            formData={mockFormData}
            templateId="professional_mutual_nda_v1"
            pendingInputFields={mockPendingInputFields}
            fieldStates={mockFieldStates}
            incomingSuggestions={{}}
            initialHtml={mockHtml}
            draftId="00000000-0000-0000-0000-000000000002"
        />
    );
}

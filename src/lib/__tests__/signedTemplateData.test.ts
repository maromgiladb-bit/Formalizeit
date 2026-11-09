import { describe, it, expect } from 'vitest'
import { buildSignedTemplateData } from '../signedTemplateData'

type Content = Record<string, unknown>

// Reference: the inline mapping previously in sign-public/route.ts.
function legacy(formData: Content, updatedContent: Content) {
    return {
        ...updatedContent,
        party_1_name: formData.party_a_name || '',
        party_1_address: formData.party_a_address || '',
        party_1_signatory_name: formData.party_a_signatory_name || updatedContent.party_1_signatory_name || '',
        party_1_signatory_title: formData.party_a_title || updatedContent.party_1_signatory_title || '',
        party_1_phone: formData.party_a_phone || '',
        party_1_emails_joined: formData.party_a_email || '',
        party_1_signature_image: updatedContent.party_1_signature_image || '',
        party_1_signature_date: updatedContent.party_1_signature_date || '',
        party_2_name: formData.party_b_name || '',
        party_2_address: formData.party_b_address || '',
        party_2_signatory_name: formData.party_b_signatory_name || updatedContent.party_2_signatory_name || '',
        party_2_signatory_title: formData.party_b_title || updatedContent.party_2_signatory_title || '',
        party_2_phone: formData.party_b_phone || '',
        party_2_emails_joined: formData.party_b_email || '',
        party_2_signature_image: updatedContent.party_2_signature_image || '',
        party_2_signature_date: updatedContent.party_2_signature_date || '',
    }
}

const formData: Content = {
    templateId: 'professional_mutual_nda_v1',
    party_a_name: 'Acme Ltd',
    party_a_address: '1 Main St',
    party_a_signatory_name: 'Ann',
    party_a_title: 'CEO',
    party_a_phone: '111',
    party_a_email: 'ann@acme.com',
    party_b_name: 'Beta Inc',
    party_b_email: 'bob@beta.com',
    effective_date: '2026-01-01',
}
const signed: Content = {
    ...formData,
    party_1_signature_image: 'data:image/png;base64,AAA',
    party_1_signature_date: '2026-02-01',
    party_2_signature_image: 'data:image/png;base64,BBB',
    party_2_signature_date: '2026-02-02',
    party_2_signatory_name: 'Bob',
    party_2_signatory_title: 'CTO',
}

describe('buildSignedTemplateData', () => {
    it('matches the previous inline sign-public mapping', () => {
        expect(buildSignedTemplateData(formData, signed)).toEqual(legacy(formData, signed))
    })

    it('maps party_a_* to party_1_* and party_b_* to party_2_*, keeping signatures', () => {
        const out = buildSignedTemplateData(formData, signed)
        expect(out.party_1_name).toBe('Acme Ltd')
        expect(out.party_1_emails_joined).toBe('ann@acme.com')
        expect(out.party_2_name).toBe('Beta Inc')
        expect(out.party_2_signatory_name).toBe('Bob')
        expect(out.party_2_signature_image).toBe('data:image/png;base64,BBB')
        expect(out.effective_date).toBe('2026-01-01')
    })

    it('single-argument form (stored content) equals the two-argument form with same object', () => {
        expect(buildSignedTemplateData(signed)).toEqual(legacy(signed, signed))
    })

    it('defaults missing fields to empty strings', () => {
        const out = buildSignedTemplateData({})
        expect(out.party_1_name).toBe('')
        expect(out.party_2_signature_image).toBe('')
    })
})

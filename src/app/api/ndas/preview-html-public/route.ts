import { NextRequest, NextResponse } from 'next/server'
import { renderNdaHtml } from '@/lib/renderNdaHtml'

/**
 * Public preview endpoint for Party B to see NDA preview without authentication
 * This is safe because:
 * 1. It only generates HTML from the provided form data
 * 2. Template content comes from our own bundled templates
 * 3. The preview iframe uses sandbox attribute for XSS protection
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('🌐 Public HTML Preview request received')

        const formData = { ...body }
        const templateId = body.templateId || 'professional_mutual_nda_v1'

        console.log('🌐 Using templateId:', templateId)

        // Render the HTML
        const html = await renderNdaHtml(formData, templateId)

        console.log('✅ Public HTML generated, size:', html.length, 'chars')

        return NextResponse.json({
            html,
            templateId,
            size: html.length
        })

    } catch (error) {
        console.error('❌ Error generating public HTML preview:', error)
        return NextResponse.json({
            error: 'Failed to generate HTML preview',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { renderNdaHtml } from '@/lib/renderNdaHtml'
import { renderHtmlToPdf } from '@/lib/htmlToPdf'
import { getActiveOrganization } from '@/lib/db-organization'

export const runtime = 'nodejs' // Required for Puppeteer

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const isDev = process.env.NODE_ENV === 'development'

    if (!userId && !isDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isDev && !userId) {
      console.log('🔧 Development mode: Allowing preview without authentication')
    }

    const body = await request.json()
    console.log('📄 PDF Preview request received')

    // Support both draftId (for saved drafts) and direct data (for unsaved forms)
    let formData: Record<string, unknown>
    let templateId = 'professional_mutual_nda_v1' // Default template

    if (body.draftId) {
      // Load from database (only works with authenticated users)
      if (!userId) {
        return NextResponse.json({
          error: 'Authentication required to load drafts'
        }, { status: 401 })
      }

      const activeMembership = await getActiveOrganization()
      if (!activeMembership) {
        return NextResponse.json({ error: 'No active organization context found' }, { status: 404 })
      }

      const draft = await prisma.ndaDraft.findFirst({
        where: { id: body.draftId, organizationId: activeMembership.organizationId }
      })

      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      formData = (draft.content as Record<string, unknown>) || {}

      // Allow template override from request even when loading from draft
      if (body.templateId) {
        templateId = body.templateId
        console.log('📋 Using templateId from request (with draftId):', templateId)
      }
    } else {
      // Use provided data directly
      formData = { ...body }
      delete formData.draftId // Clean up if present
      // Allow template override from request
      if (body.templateId) {
        templateId = body.templateId
        delete formData.templateId // Remove from formData to avoid confusion
        console.log('📋 Using templateId from request:', templateId)
      }
    }

    // renderNdaHtml's normalizeFormData handles all field mapping
    // (party_a→party_1, ask_receiver_fill placeholders, etc.)
    console.log('📄 Rendering HTML from template:', templateId)
    const html = await renderNdaHtml(formData, templateId)

    console.log('📄 Converting HTML to PDF with 1:1 rendering...')
    const pdfBuffer = await renderHtmlToPdf(html, {
      pageWidthPx: 900,  // Match preview container width
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      isA4: true,
      debugScreenshot: false,  // Set to true to save debug screenshot
    })

    console.log('✅ PDF generated successfully')

    // Return as base64 data URL for compatibility with existing UI
    const base64 = pdfBuffer.toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64}`

    return NextResponse.json({
      fileUrl: dataUrl,
      base64,
      mime: 'application/pdf',
      filename: `${formData.docName || 'NDA'}.pdf`
    })

  } catch (error) {
    console.error('❌ Error generating preview:', error)
    return NextResponse.json({
      error: 'Failed to generate preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
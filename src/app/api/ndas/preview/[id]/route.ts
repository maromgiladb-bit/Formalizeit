import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { renderNdaHtml } from '@/lib/renderNdaHtml'
import { htmlToPdf } from '@/lib/htmlToPdf'
import fs from 'fs'
import path from 'path'
import { getActiveOrganization } from '@/lib/db-organization'

export const runtime = 'nodejs' // Required for Puppeteer

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📄 Preview request for draft:', params.id)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { externalId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const activeMembership = await getActiveOrganization()
    if (!activeMembership) {
      return NextResponse.json({ error: 'No active organization context found' }, { status: 404 })
    }

    // Load draft from database
    const draft = await prisma.ndaDraft.findFirst({
      where: {
        id: params.id,
        organizationId: activeMembership.organizationId
      }
    })

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const formData = (draft.content as Record<string, unknown>) || {}
    const templateId = 'mutual-nda-v3' // Default template for now

    // Process "ask receiver to fill" placeholders
    const processedData = { ...formData }

    if (formData.party_a_ask_receiver_fill) {
      processedData.party_a_name = formData.party_a_name || "[To be filled by receiving party]"
      processedData.party_a_address = formData.party_a_address || "[To be filled by receiving party]"
      processedData.party_a_signatory_name = formData.party_a_signatory_name || "[To be filled by receiving party]"
      processedData.party_a_title = formData.party_a_title || "[To be filled by receiving party]"
      console.log('📄 Party A: ask receiver to fill')
    }

    if (formData.party_b_ask_receiver_fill) {
      processedData.party_b_name = formData.party_b_name || "[To be filled by receiving party]"
      processedData.party_b_address = formData.party_b_address || "[To be filled by receiving party]"
      processedData.party_b_signatory_name = formData.party_b_signatory_name || "[To be filled by receiving party]"
      processedData.party_b_title = formData.party_b_title || "[To be filled by receiving party]"
      processedData.party_b_email = formData.party_b_email || "[To be filled by receiving party]"
      console.log('📄 Party B: ask receiver to fill')
    }

    console.log('📄 Rendering HTML from template...')
    const html = await renderNdaHtml(processedData, templateId)

    console.log('📄 Converting HTML to PDF...')
    const pdfBuffer = await htmlToPdf(html)

    // Save PDF locally in tmp folder
    const tmpDir = path.join(process.cwd(), 'tmp')

    // Ensure tmp directory exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    // Generate filename with draft ID
    const filename = `nda-preview-${params.id}.pdf`
    const filepath = path.join(tmpDir, filename)

    // Write PDF to file
    fs.writeFileSync(filepath, pdfBuffer)
    console.log('✅ PDF saved locally:', filepath)

    // Return path relative to public URL (served via Next.js static files or API)
    // For local development, we'll serve via a separate API route
    return NextResponse.json({
      success: true,
      path: `/api/ndas/preview/${params.id}/file`,
      filename: filename,
      size: pdfBuffer.length
    })

  } catch (error) {
    console.error('❌ Error generating preview:', error)
    return NextResponse.json({
      error: 'Failed to generate preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

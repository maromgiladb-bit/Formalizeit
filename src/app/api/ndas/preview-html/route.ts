import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { renderNdaHtml } from '@/lib/renderNdaHtml'
import { getActiveOrganization } from '@/lib/db-organization'
// Note: JSDOM/DOMPurify removed - causing serverless issues
// Sanitization is done client-side via iframe sandbox

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('🌐 HTML Preview request received')
    console.log('🌐 Request body keys:', Object.keys(body))
    console.log('🌐 body.templateId:', body.templateId)

    // Support both draftId (for saved drafts) and direct data (for unsaved forms)
    let formData: Record<string, unknown>
    let templateId = 'mutual-nda-html' // Default to HTML template

    if (body.draftId) {
      // Load from database
      console.log('🌐 Loading draft from database:', body.draftId)

      const activeMembership = await getActiveOrganization()
      if (!activeMembership) {
        return NextResponse.json({ error: 'No active organization context found' }, { status: 404 })
      }

      const draft = await prisma.ndaDraft.findFirst({
        where: {
          id: body.draftId,
          organizationId: activeMembership.organizationId
        }
      })

      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      formData = (draft.content as Record<string, unknown>) || {}
    } else {
      // Use provided data directly
      formData = { ...body }
      delete formData.draftId // Clean up if present
    }

    // Allow template override from request
    if (body.templateId) {
      templateId = body.templateId
      console.log('🌐 Using templateId from request:', templateId)
    } else {
      console.log('🌐 Using default templateId:', templateId)
    }

    // Process "ask receiver to fill" placeholders for individual Party B fields
    const processedData = { ...formData }

    if (formData.party_a_ask_receiver_fill) {
      processedData.party_a_name = formData.party_a_name || "[To be filled by receiving party]"
      processedData.party_a_address = formData.party_a_address || "[To be filled by receiving party]"
      processedData.party_a_signatory_name = formData.party_a_signatory_name || "[To be filled by receiving party]"
      processedData.party_a_title = formData.party_a_title || "[To be filled by receiving party]"
      console.log('🌐 Party A: ask receiver to fill')
    }

    // Handle individual Party B fields
    if (formData.party_b_name_ask_receiver) {
      processedData.party_b_name = formData.party_b_name || "[To be filled by receiving party]"
      console.log('🌐 Party B name: ask receiver to fill')
    }
    if (formData.party_b_address_ask_receiver) {
      processedData.party_b_address = formData.party_b_address || "[To be filled by receiving party]"
      console.log('🌐 Party B address: ask receiver to fill')
    }
    if (formData.party_b_phone_ask_receiver) {
      processedData.party_b_phone = formData.party_b_phone || "[To be filled by receiving party]"
      console.log('🌐 Party B phone: ask receiver to fill')
    }
    if (formData.party_b_signatory_name_ask_receiver) {
      processedData.party_b_signatory_name = formData.party_b_signatory_name || "[To be filled by receiving party]"
      console.log('🌐 Party B signatory: ask receiver to fill')
    }
    if (formData.party_b_title_ask_receiver) {
      processedData.party_b_title = formData.party_b_title || "[To be filled by receiving party]"
      console.log('🌐 Party B title: ask receiver to fill')
    }
    if (formData.party_b_email_ask_receiver) {
      processedData.party_b_email = formData.party_b_email || "[To be filled by receiving party]"
      console.log('🌐 Party B email: ask receiver to fill')
    }

    console.log('🌐 Rendering HTML from template:', templateId)
    const html = await renderNdaHtml(processedData, templateId)

    // Note: Server-side JSDOM sanitization removed due to serverless compatibility issues
    // The preview iframe uses sandbox attribute for client-side XSS protection
    // Template content comes from our own bundled templates, so XSS risk is minimal

    console.log('✅ HTML generated, size:', html.length, 'chars')

    return NextResponse.json({
      html,
      templateId,
      size: html.length
    })

  } catch (error) {
    console.error('❌ Error generating HTML preview:', error)
    return NextResponse.json({
      error: 'Failed to generate HTML preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

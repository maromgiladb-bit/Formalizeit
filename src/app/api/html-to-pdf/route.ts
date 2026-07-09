import { NextRequest, NextResponse } from 'next/server';
import { renderHtmlToPdf } from '@/lib/htmlToPdf';

export const runtime = 'nodejs'; // Required for Puppeteer

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { htmlContent } = body;

    if (!htmlContent) {
      return NextResponse.json({ error: 'Missing htmlContent' }, { status: 400 });
    }

    console.log('📄 Converting HTML to PDF...');
    const pdfBuffer = await renderHtmlToPdf(htmlContent, {
      pageWidthPx: 900,
      isA4: true,
    });

    console.log('✅ PDF generated successfully from HTML');

    const base64 = pdfBuffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    return NextResponse.json({
      fileUrl: dataUrl,
      base64,
    });

  } catch (error) {
    console.error('❌ Error generating PDF from HTML:', error);
    return NextResponse.json({
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

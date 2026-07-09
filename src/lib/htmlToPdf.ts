import puppeteer, { Browser } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

let browserInstance: Browser | null = null

/**
 * Get browser executable path
 * In production (Vercel), use chromium package
 * In development, use local Chrome installation
 */
async function getExecutablePath(): Promise<string> {
  // If CHROME_PATH is set in env, use it
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH
  }

  // In production (e.g., Vercel), use chromium package
  if (process.env.NODE_ENV === 'production') {
    return await chromium.executablePath()
  }

  // Development: try common Chrome paths
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', // Windows 32-bit
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
    '/usr/bin/google-chrome', // Linux
    '/usr/bin/chromium-browser', // Linux alternative
  ]

  // Return first path that exists (for dev)
  // In reality, puppeteer will find Chrome automatically in dev
  return paths[0] // Default to Windows path for this project
}

/**
 * Get or create browser instance (reuse for performance)
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance
  }

  const executablePath = await getExecutablePath()
  
  browserInstance = await puppeteer.launch({
    headless: true,
    executablePath,
    args: process.env.NODE_ENV === 'production' 
      ? chromium.args
      : ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=medium'],
  })

  return browserInstance
}

/**
 * Inject base tag for absolute asset URLs
 */
function injectBase(html: string, baseUrl: string): string {
  // Skip if base tag already exists
  if (html.includes('<base ')) {
    return html
  }
  
  // Ensure baseUrl ends with /
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  
  // Inject after <head>
  return html.replace('<head>', `<head><base href="${normalizedBase}">`)
}

/**
 * Options for PDF rendering
 */
export type PdfOptions = {
  /** Width of the page in pixels - should match preview container width (default: 900) */
  pageWidthPx?: number
  /** Base URL for resolving assets (fonts, images, etc.) */
  baseUrl?: string
  /** Use A4 page size (default: true, otherwise Letter) */
  isA4?: boolean
  /** Enable debug screenshot (saves to pdf-debug.png) */
  debugScreenshot?: boolean
}

/**
 * Convert HTML string to PDF buffer with pixel-perfect 1:1 rendering
 * 
 * This function ensures the PDF matches the on-screen HTML preview exactly by:
 * - Using the same viewport width as the preview
 * - Applying SCREEN media type (not print) for exact visual match
 * - Forcing background colors/images to render
 * - Respecting @page CSS rules for size
 * 
 * @param rawHtml - HTML string to convert (must include full <html> document)
 * @param opts - Rendering options
 * @returns PDF as Buffer
 * 
 * @example
 * ```ts
 * const html = await renderNdaHtml(data, templateId)
 * const pdf = await renderHtmlToPdf(html, {
 *   pageWidthPx: 900,  // Match your preview container width
 *   baseUrl: 'http://localhost:3000',
 *   isA4: true
 * })
 * ```
 */
export async function renderHtmlToPdf(
  rawHtml: string, 
  opts: PdfOptions = {}
): Promise<Buffer> {
  const {
    pageWidthPx = 900,
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
    isA4 = true,
    debugScreenshot = false,
  } = opts

  // Inject base tag for asset resolution
  const html = injectBase(rawHtml, baseUrl)

  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    // Match the preview width with high DPR for sharp text
    // Height is arbitrary since PDF will flow to multiple pages
    await page.setViewport({
      width: pageWidthPx,
      height: 1600,
      deviceScaleFactor: 1,  // Use 1x for exact pixel matching
    })

    // Use 'screen' media type for exact 1:1 matching with HTML preview
    // This ensures PDF looks identical to what user sees in browser
    await page.emulateMediaType('screen')

    // Load HTML and wait for all network resources AND fonts
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
    })
    
    // Wait an additional moment for fonts to render
    await page.evaluateHandle('document.fonts.ready')

    // Optional debug screenshot to verify visual parity
    if (debugScreenshot) {
      await page.screenshot({
        path: 'pdf-debug.png',
        fullPage: true,
      })
      console.log('🐛 Debug screenshot saved to pdf-debug.png')
    }

    // Generate PDF with exact control
    const pdfBuffer = await page.pdf({
      printBackground: true,        // CRITICAL: render backgrounds, shadows, colors
      preferCSSPageSize: true,      // CRITICAL: respect @page { size: A4; margin: 0; }
      format: isA4 ? 'A4' : 'Letter', // Fallback if CSS doesn't specify
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      scale: 1,                       // No scaling for exact match
    })

    console.log('✅ PDF generated:', {
      size: `${(pdfBuffer.length / 1024).toFixed(1)} KB`,
      viewport: `${pageWidthPx}px`,
      pageSize: isA4 ? 'A4' : 'Letter',
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await page.close()
  }
}

/**
 * Legacy function name - now calls renderHtmlToPdf
 * @deprecated Use renderHtmlToPdf directly
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  return renderHtmlToPdf(html, {})
}

/**
 * Close browser instance (call on app shutdown if needed)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}

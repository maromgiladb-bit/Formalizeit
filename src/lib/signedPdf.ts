export type SignedPdfStatus = 'stored' | 'store_failed' | 'render_failed'

export interface SignedPdfResult {
    status: SignedPdfStatus
    /** The rendered PDF, kept even when storing failed so it can still be emailed. */
    pdfBuffer: Buffer | null
    /** SHA-256 of `pdfBuffer`; null only when rendering failed. */
    agreementHash: string | null
    /** The error from the step that failed, for reporting. */
    error?: unknown
}

export interface SignedPdfSteps {
    render: () => Promise<Buffer>
    store: (pdf: Buffer) => Promise<void>
    hash: (pdf: Buffer) => string
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    attempts: number,
    delayMs: number
): Promise<T> {
    let lastError: unknown
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error
            if (attempt < attempts) {
                await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
            }
        }
    }
    throw lastError
}

/**
 * Render, fingerprint and store the executed NDA. Both steps are retried because cold-start
 * Chromium and S3 both fail transiently. Never throws: signing has already been committed, so
 * a failure is reported through `status` and the caller must record and alert on it.
 */
export async function produceSignedPdf(
    steps: SignedPdfSteps,
    opts: { renderAttempts?: number; storeAttempts?: number; delayMs?: number } = {}
): Promise<SignedPdfResult> {
    const { renderAttempts = 2, storeAttempts = 3, delayMs = 500 } = opts

    let pdfBuffer: Buffer
    try {
        pdfBuffer = await withRetry(steps.render, renderAttempts, delayMs)
    } catch (error) {
        return { status: 'render_failed', pdfBuffer: null, agreementHash: null, error }
    }

    const agreementHash = steps.hash(pdfBuffer)

    try {
        await withRetry(() => steps.store(pdfBuffer), storeAttempts, delayMs)
    } catch (error) {
        return { status: 'store_failed', pdfBuffer, agreementHash, error }
    }

    return { status: 'stored', pdfBuffer, agreementHash }
}

import { describe, it, expect, vi } from 'vitest'
import { produceSignedPdf, withRetry } from '@/lib/signedPdf'

const pdf = Buffer.from('%PDF-test')
const hash = () => 'hash-of-pdf'
const fast = { delayMs: 0 }

describe('withRetry', () => {
  it('returns the first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    await expect(withRetry(fn, 3, 0)).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries and returns a later success', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('cold start')).mockResolvedValue('ok')
    await expect(withRetry(fn, 3, 0)).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws the last error once attempts are exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('down'))
    await expect(withRetry(fn, 3, 0)).rejects.toThrow('down')
    expect(fn).toHaveBeenCalledTimes(3)
  })
})

describe('produceSignedPdf', () => {
  it('stores the pdf and returns its hash on the happy path', async () => {
    const store = vi.fn().mockResolvedValue(undefined)
    const result = await produceSignedPdf({ render: async () => pdf, store, hash }, fast)
    expect(result).toEqual({ status: 'stored', pdfBuffer: pdf, agreementHash: 'hash-of-pdf' })
    expect(store).toHaveBeenCalledWith(pdf)
  })

  it('recovers from a transient render failure', async () => {
    const render = vi.fn().mockRejectedValueOnce(new Error('chromium')).mockResolvedValue(pdf)
    const result = await produceSignedPdf({ render, store: async () => {}, hash }, fast)
    expect(result.status).toBe('stored')
    expect(render).toHaveBeenCalledTimes(2)
  })

  it('reports render_failed with no pdf and no hash when rendering keeps failing', async () => {
    const store = vi.fn()
    const err = new Error('render down')
    const result = await produceSignedPdf({ render: async () => { throw err }, store, hash }, fast)
    expect(result).toMatchObject({ status: 'render_failed', pdfBuffer: null, agreementHash: null, error: err })
    expect(store).not.toHaveBeenCalled()
  })

  it('recovers from a transient S3 failure', async () => {
    const store = vi.fn().mockRejectedValueOnce(new Error('s3 blip')).mockResolvedValue(undefined)
    const result = await produceSignedPdf({ render: async () => pdf, store, hash }, fast)
    expect(result.status).toBe('stored')
    expect(store).toHaveBeenCalledTimes(2)
  })

  it('keeps the pdf and hash when storing keeps failing, so it can still be emailed', async () => {
    const err = new Error('s3 down')
    const store = vi.fn().mockRejectedValue(err)
    const result = await produceSignedPdf({ render: async () => pdf, store, hash }, fast)
    expect(result).toMatchObject({ status: 'store_failed', pdfBuffer: pdf, agreementHash: 'hash-of-pdf', error: err })
    expect(store).toHaveBeenCalledTimes(3)
  })
})

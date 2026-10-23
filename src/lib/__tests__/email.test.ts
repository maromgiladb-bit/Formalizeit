import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { sendMock, captureMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  captureMock: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))
vi.mock('@sentry/nextjs', () => ({ captureException: captureMock }))

async function loadEmail() {
  vi.resetModules()
  return import('@/lib/email')
}

const message = { to: 'receiver@example.com', subject: 'Hello', html: '<p>hi</p>' }

describe('sendEmail', () => {
  beforeEach(() => {
    sendMock.mockReset()
    captureMock.mockReset()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('skips quietly outside production when no key is configured', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('RESEND_API_KEY', '')
    const { sendEmail } = await loadEmail()
    await expect(sendEmail(message)).resolves.toBeUndefined()
    expect(sendMock).not.toHaveBeenCalled()
    expect(captureMock).not.toHaveBeenCalled()
  })

  it('throws and reports to Sentry in production when no key is configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('RESEND_API_KEY', '')
    const { sendEmail } = await loadEmail()
    await expect(sendEmail(message)).rejects.toThrow('RESEND_API_KEY is not configured')
    expect(captureMock).toHaveBeenCalledTimes(1)
  })

  it('sends from the verified domain by default and replies to support', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    vi.stubEnv('MAIL_FROM', '')
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null })
    const { sendEmail } = await loadEmail()
    await sendEmail(message)
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'FormalizeIt <noreply@mail.formalizeit.com>',
        replyTo: 'support@formalizeit.com',
        to: 'receiver@example.com',
      })
    )
  })

  it('honors MAIL_FROM and an explicit replyTo', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    vi.stubEnv('MAIL_FROM', 'Custom <hello@mail.formalizeit.com>')
    sendMock.mockResolvedValue({ data: { id: 'email_2' }, error: null })
    const { sendEmail } = await loadEmail()
    await sendEmail({ ...message, replyTo: 'dana@acme.com' })
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'Custom <hello@mail.formalizeit.com>', replyTo: 'dana@acme.com' })
    )
  })

  it('throws, reports, and does not log the recipient when Resend returns an error', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    sendMock.mockResolvedValue({ data: null, error: { message: 'domain not verified', name: 'validation_error' } })
    const { sendEmail } = await loadEmail()
    await expect(sendEmail(message)).rejects.toThrow('domain not verified')
    expect(captureMock).toHaveBeenCalledTimes(1)
    const logged = JSON.stringify([
      ...vi.mocked(console.log).mock.calls,
      ...vi.mocked(console.error).mock.calls,
    ])
    expect(logged).not.toContain('receiver@example.com')
  })

  it('reports a network failure too', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    sendMock.mockRejectedValue(new Error('fetch failed'))
    const { sendEmail } = await loadEmail()
    await expect(sendEmail(message)).rejects.toThrow('fetch failed')
    expect(captureMock).toHaveBeenCalledTimes(1)
  })
})

describe('paymentFailedEmailHtml', () => {
  it('links to billing and escapes the organization name', async () => {
    const { paymentFailedEmailHtml } = await loadEmail()
    const html = paymentFailedEmailHtml('Acme <script>alert(1)</script>', 'https://formalizeit.com/settings/billing')
    expect(html).toContain('https://formalizeit.com/settings/billing')
    expect(html).toContain('Update payment method')
    expect(html).not.toContain('<script>')
  })
})

import { describe, it, expect, vi, afterEach } from 'vitest'
import { getFaqs } from '@/app/faq/faq-data'
import { planFacts } from '@/ai/prompts/formi_systemPrompt'

// Mirrors TEASER_FAQ_INDEXES in src/app/page.tsx.
const TEASER_FAQ_INDEXES = [0, 2, 5, 13]

describe('getFaqs', () => {
  it('has the same length in both modes and valid teaser indexes', () => {
    const paid = getFaqs(true)
    const beta = getFaqs(false)
    expect(beta).toHaveLength(paid.length)
    for (const i of TEASER_FAQ_INDEXES) {
      expect(beta[i]).toBeDefined()
      expect(beta[i].question).toBe(paid[i].question)
    }
  })

  it('swaps billing answers only in beta mode', () => {
    const q = 'What is included in the free plan?'
    expect(getFaqs(true).find((f) => f.question === q)!.answer).toContain('up to 3 NDAs')
    expect(getFaqs(false).find((f) => f.question === q)!.answer).toContain('free beta')
  })
})

describe('planFacts', () => {
  it('paid mode quotes the real limits and no beta note', () => {
    const facts = planFacts(true)
    expect(facts).toContain('3 NDAs total')
    expect(facts).not.toContain('free beta')
  })

  it('beta mode says unlimited NDAs / 10 users and the free-beta sentence', () => {
    const facts = planFacts(false)
    expect(facts).toContain('FormalizeIt is in a free beta: unlimited NDAs and up to 10 users at no cost.')
    expect(facts).toContain("Don't quote prices.")
    expect(facts).toContain('Free — up to 10 user(s), unlimited NDAs total')
  })
})

describe('PAID_PLANS_ENABLED parsing', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  async function flag(value: string) {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_PAID_PLANS_ENABLED', value)
    return (await import('@/lib/featureFlags')).PAID_PLANS_ENABLED
  }

  it('only the exact string "true" enables paid plans', async () => {
    expect(await flag('true')).toBe(true)
    for (const v of ['false', '1', 'TRUE', 'yes', '']) expect(await flag(v)).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { safeInternalPath } from './safeRedirect'

describe('safeInternalPath', () => {
  it('keeps internal paths, including query and hash', () => {
    expect(safeInternalPath('/dashboard')).toBe('/dashboard')
    expect(safeInternalPath('/fillndahtml?draftId=abc#step-2')).toBe('/fillndahtml?draftId=abc#step-2')
    expect(safeInternalPath('/settings/team')).toBe('/settings/team')
  })

  it('falls back when missing or not a path', () => {
    expect(safeInternalPath(undefined)).toBe('/dashboard')
    expect(safeInternalPath(null)).toBe('/dashboard')
    expect(safeInternalPath('')).toBe('/dashboard')
    expect(safeInternalPath('dashboard')).toBe('/dashboard')
    expect(safeInternalPath('https://evil.com')).toBe('/dashboard')
    expect(safeInternalPath('javascript:alert(1)')).toBe('/dashboard')
  })

  it('rejects off-site tricks (T-048)', () => {
    for (const attack of [
      '//evil.com',
      '/\\evil.com',
      '/\\/evil.com',
      '\\\\evil.com',
      '/\t/evil.com',
      '/\n/evil.com',
      '/\r/evil.com',
      '/%0A',
    ]) {
      const out = safeInternalPath(attack)
      expect(out.startsWith('/')).toBe(true)
      expect(out.startsWith('//')).toBe(false)
      expect(out).not.toContain('evil.com')
    }
  })

  it('uses the given fallback', () => {
    expect(safeInternalPath('//evil.com', '/')).toBe('/')
  })
})

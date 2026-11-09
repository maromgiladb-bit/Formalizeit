import { describe, it, expect } from 'vitest'
import { shouldApplySubscriptionEvent } from '../subscriptionGuards'

describe('shouldApplySubscriptionEvent', () => {
  it('applies when the event is for the stored subscription', () => {
    expect(shouldApplySubscriptionEvent('sub_1', 'sub_1')).toBe(true)
  })

  it('applies when no subscription is stored yet', () => {
    expect(shouldApplySubscriptionEvent(null, 'sub_1')).toBe(true)
    expect(shouldApplySubscriptionEvent(undefined, 'sub_1')).toBe(true)
  })

  it('ignores an event for a different (duplicate) subscription', () => {
    expect(shouldApplySubscriptionEvent('sub_1', 'sub_2')).toBe(false)
  })
})

/**
 * Whether a subscription event may change an organization's billing columns.
 *
 * An organization tracks exactly one Stripe subscription (`stripeSubscriptionId`).
 * A stale or duplicate subscription (e.g. a second checkout that was later
 * cancelled) must not downgrade or overwrite a company whose live subscription
 * is a different one. When nothing is stored yet there is nothing to protect, so
 * the event applies.
 */
export function shouldApplySubscriptionEvent(
  storedSubscriptionId: string | null | undefined,
  eventSubscriptionId: string
): boolean {
  return !storedSubscriptionId || storedSubscriptionId === eventSubscriptionId
}

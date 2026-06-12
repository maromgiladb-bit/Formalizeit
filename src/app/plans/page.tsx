import { redirect } from 'next/navigation'

// Pricing now lives on the home page. This route stays alive because
// external entry points (e.g. the Stripe checkout cancel_url) link to /plans.
export default function Plans() {
  redirect('/#pricing')
}

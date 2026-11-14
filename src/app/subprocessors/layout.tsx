import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sub-processors — FormalizeIt',
  description: 'The third-party providers that help FormalizeIt run, what each does, and the data involved.',
}

export default function SubprocessorsLayout({ children }: { children: React.ReactNode }) {
  return children
}

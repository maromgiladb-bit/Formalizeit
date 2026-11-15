'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, Users, Building2, CreditCard, ShieldCheck } from 'lucide-react'

const navigation = [
    { name: 'General', href: '/settings', icon: Settings },
    { name: 'Sign-in & Security', href: '/settings/account-security', icon: ShieldCheck },
    { name: 'Team', href: '/settings/team', icon: Users },
    { name: 'Company Profile', href: '/settings/company-profile', icon: Building2 },
    { name: 'Subscription', href: '/settings/billing', icon: CreditCard },
]

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-ground font-sans">

            {/* Header */}
            <section className="border-b border-line bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
                    <h1 className="text-3xl sm:text-4xl font-display font-semibold text-ink tracking-tight">My account</h1>
                    <p className="text-base text-muted-ink leading-relaxed mt-2 max-w-lg">
                        Manage your account, team, and billing preferences.
                    </p>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Sidebar — horizontal scrollable pill bar on mobile, vertical list on desktop */}
                    <aside className="lg:w-56 shrink-0">
                        <nav className="lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible -mx-4 px-4 lg:mx-0 lg:px-0 pb-0 lg:pb-0 max-lg:border-b max-lg:border-line max-lg:gap-0">
                            {navigation.map((item) => {
                                const isCurrent = item.href === '/settings'
                                    ? pathname === '/settings'
                                    : pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`
                                            relative flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 lg:rounded-control
                                            max-lg:border-b-2 max-lg:-mb-px
                                            ${isCurrent
                                                ? 'text-ink font-semibold max-lg:border-teal-800 lg:bg-white lg:border lg:border-line lg:shadow-[inset_3px_0_0_0_var(--color-teal-800)]'
                                                : 'text-muted-ink hover:text-ink hover:bg-white/70 max-lg:border-transparent lg:border lg:border-transparent'
                                            }
                                        `}
                                        aria-current={isCurrent ? 'page' : undefined}
                                    >
                                        <item.icon aria-hidden="true" className={`w-4 h-4 ${isCurrent ? 'text-teal-800' : 'text-gray-500'}`} />
                                        <span className="truncate">{item.name}</span>
                                    </Link>
                                )
                            })}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

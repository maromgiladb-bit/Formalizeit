'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, Users, Building2, CreditCard } from 'lucide-react'

const navigation = [
    { name: 'General', href: '/settings', icon: Settings },
    { name: 'Team', href: '/settings/team', icon: Users },
    { name: 'Company Profile', href: '/settings/company-profile', icon: Building2 },
    { name: 'Billing', href: '/settings/billing', icon: CreditCard },
]

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-white font-sans">

            {/* Header */}
            <section className="border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
                    <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">Account</p>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
                    <p className="text-base text-gray-500 leading-relaxed mt-2 max-w-lg">
                        Manage your account, team, and billing preferences.
                    </p>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Sidebar */}
                    <aside className="lg:w-56 shrink-0">
                        <nav className="sticky top-24 space-y-1">
                            {navigation.map((item) => {
                                const isCurrent = item.href === '/settings'
                                    ? pathname === '/settings'
                                    : pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
                                            ${isCurrent
                                                ? 'bg-teal-800 text-white'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }
                                        `}
                                        aria-current={isCurrent ? 'page' : undefined}
                                    >
                                        <item.icon className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />
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

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    const navigation = [
        { name: 'General', href: '/settings', current: pathname === '/settings' },
        { name: 'Team', href: '/settings/team', current: pathname === '/settings/team' },
        { name: 'Company Profile', href: '/settings/company-profile', current: pathname === '/settings/company-profile' },
        { name: 'Billing', href: '/settings/billing', current: pathname === '/settings/billing' },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <h1 className="text-3xl font-bold leading-tight text-gray-900">Settings</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
                    {/* Sidebar */}
                    <aside className="py-6 px-2 sm:px-6 lg:col-span-3 lg:py-0 lg:px-0">
                        <nav className="space-y-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    group rounded-md px-3 py-2 flex items-center text-sm font-medium
                    ${item.current
                                            ? 'bg-teal-50 text-teal-700 hover:text-teal-700 hover:bg-teal-50'
                                            : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900'
                                        }
                  `}
                                    aria-current={item.current ? 'page' : undefined}
                                >
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <div className="space-y-6 sm:px-6 lg:col-span-9 lg:px-0">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

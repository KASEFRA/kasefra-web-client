'use client'

/**
 * Site Header Component
 * Top header for dashboard pages
 */

import { usePathname } from 'next/navigation'
import UserNav from './user-nav'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/accounts': 'Accounts',
  '/dashboard/transactions': 'Transactions',
  '/dashboard/budgets': 'Budgets',
  '/dashboard/goals': 'Goals',
  '/dashboard/reports': 'Reports',
  '/dashboard/settings': 'Settings',
}

export default function SiteHeader() {
  const pathname = usePathname()
  const pageTitle = pageTitles[pathname] || 'Dashboard'

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
        </div>

        {/* Right Section - User Navigation */}
        <div className="flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  )
}

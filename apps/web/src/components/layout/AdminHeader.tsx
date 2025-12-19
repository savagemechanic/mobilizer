'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Breadcrumbs, UserMenuDropdown, MobileMenuSheet } from '@/organisms'
import { ThemeToggle, NotificationBell, AdminRoleBadge } from '@/molecules'
import { cn } from '@/lib/utils'

interface AdminHeaderProps {
  variant?: 'admin' | 'platform-admin'
  sidebarContent?: React.ReactNode
}

// Breadcrumb mapping for routes
const BREADCRUMB_LABELS: Record<string, string> = {
  admin: 'Admin',
  'platform-admin': 'Platform Admin',
  dashboard: 'Dashboard',
  members: 'Members',
  posts: 'Posts & Feeds',
  events: 'Events',
  polls: 'Polls',
  orgs: 'Support Groups',
  wallet: 'Wallet',
  audit: 'Audit Trail',
  permissions: 'Permissions',
  movements: 'Movements',
  'super-admins': 'Super Admins',
  settings: 'Settings',
  users: 'Users',
}

export function AdminHeader({ variant = 'admin', sidebarContent }: AdminHeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    return segments.map((segment, index) => ({
      label:
        BREADCRUMB_LABELS[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      href: '/' + segments.slice(0, index + 1).join('/'),
    }))
  }

  const breadcrumbs = getBreadcrumbs()
  const isPlatformVariant = variant === 'platform-admin'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b backdrop-blur-lg supports-[backdrop-filter]:bg-background/80',
        isPlatformVariant
          ? 'bg-gradient-to-r from-indigo-900/95 to-purple-900/95 border-indigo-700 text-white'
          : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700'
      )}
    >
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Mobile Menu */}
        <MobileMenuSheet
          variant={variant}
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
        >
          <div onClick={() => setMobileMenuOpen(false)}>{sidebarContent}</div>
        </MobileMenuSheet>

        {/* Logo / Brand */}
        <Link
          href={isPlatformVariant ? '/platform-admin/dashboard' : '/admin/dashboard'}
          className="flex items-center gap-2 font-bold text-lg"
        >
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              isPlatformVariant
                ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                : 'bg-gradient-to-br from-primary to-primary/80'
            )}
          >
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span
            className={cn(
              'hidden sm:inline-block',
              isPlatformVariant ? 'text-white' : 'text-slate-900 dark:text-white'
            )}
          >
            Mobilizer
          </span>
        </Link>

        {/* Breadcrumbs */}
        <Breadcrumbs
          items={breadcrumbs}
          className={cn(
            'hidden md:flex ml-4',
            isPlatformVariant
              ? 'text-indigo-200 [&_a]:text-indigo-200 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-indigo-300'
              : ''
          )}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Role Badge */}
        <AdminRoleBadge className="hidden lg:flex" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle variant={variant} />

          {/* Notifications */}
          <NotificationBell variant={variant} />

          {/* User Menu */}
          <UserMenuDropdown variant={variant} />
        </div>
      </div>
    </header>
  )
}

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'
import { ADMIN_NAVIGATION, getFilteredNavigation, type NavSection } from '@/config/navigation'

interface AdminSidebarNavProps {
  navigation: NavSection[]
  pathname: string
  highestRole: string
  variant?: 'desktop' | 'mobile'
}

// Shared navigation content component
export function AdminSidebarNav({
  navigation,
  pathname,
  highestRole,
  variant = 'desktop',
}: AdminSidebarNavProps) {
  return (
    <>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navigation.map((section) => (
          <div key={section.id} className="mb-6">
            {/* Section Header */}
            <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {section.label}
            </h3>

            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Role Badge at bottom */}
      {variant === 'desktop' && (
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Role:</span>
            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
              {highestRole.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </>
  )
}

// Mobile navigation content (for Sheet)
export function AdminMobileNav() {
  const pathname = usePathname()
  const { hasPermission, hasRole, isLoading, highestRole } = usePermissions()

  const navigation = useMemo(() => {
    if (isLoading) return []
    return getFilteredNavigation(ADMIN_NAVIGATION, hasPermission, hasRole)
  }, [hasPermission, hasRole, isLoading])

  if (isLoading) {
    return (
      <div className="px-3 py-4 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-slate-800 rounded-md animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <AdminSidebarNav
      navigation={navigation}
      pathname={pathname}
      highestRole={highestRole}
      variant="mobile"
    />
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { hasPermission, hasRole, isLoading, highestRole } = usePermissions()

  // Filter navigation based on user's permissions
  const navigation = useMemo(() => {
    if (isLoading) return []
    return getFilteredNavigation(ADMIN_NAVIGATION, hasPermission, hasRole)
  }, [hasPermission, hasRole, isLoading])

  // Show loading skeleton while permissions load
  if (isLoading) {
    return (
      <aside className="hidden md:flex w-64 flex-col border-r bg-slate-900 text-white">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="text-lg font-bold">Admin Panel</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage your organization</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-800 rounded-md animate-pulse" />
          ))}
        </nav>
      </aside>
    )
  }

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-slate-900 text-white">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-lg font-bold">Admin Panel</h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage your organization</p>
      </div>
      <AdminSidebarNav
        navigation={navigation}
        pathname={pathname}
        highestRole={highestRole}
        variant="desktop"
      />
    </aside>
  )
}

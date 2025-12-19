'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'
import { PLATFORM_ADMIN_NAVIGATION, getFilteredNavigation, type NavSection } from '@/config/navigation'

interface PlatformAdminSidebarNavProps {
  navigation: NavSection[]
  pathname: string
  variant?: 'desktop' | 'mobile'
}

// Shared navigation content component
export function PlatformAdminSidebarNav({ navigation, pathname, variant = 'desktop' }: PlatformAdminSidebarNavProps) {
  return (
    <>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navigation.map((section) => (
          <div key={section.id} className="mb-6">
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
                        ? 'bg-white/15 text-white shadow-md backdrop-blur-sm'
                        : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isActive && 'text-yellow-400')} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {variant === 'desktop' && (
        <div className="p-4 border-t border-indigo-700/50">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20">
            <Crown className="h-4 w-4 text-yellow-400" />
            <div className="text-xs">
              <p className="font-semibold text-white">Platform Administrator</p>
              <p className="text-indigo-200">Full system access</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Mobile navigation content (for Sheet)
export function PlatformAdminMobileNav() {
  const pathname = usePathname()
  const { hasPermission, hasRole, isLoading } = usePermissions()

  const navigation = useMemo(() => {
    if (isLoading) return []
    return getFilteredNavigation(PLATFORM_ADMIN_NAVIGATION, hasPermission, hasRole)
  }, [hasPermission, hasRole, isLoading])

  if (isLoading) {
    return (
      <div className="px-3 py-4 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-indigo-800/50 rounded-md animate-pulse" />
        ))}
      </div>
    )
  }

  return <PlatformAdminSidebarNav navigation={navigation} pathname={pathname} variant="mobile" />
}

export function PlatformAdminSidebar() {
  const pathname = usePathname()
  const { hasPermission, hasRole, isLoading } = usePermissions()

  // Filter navigation based on permissions (though platform admin has all)
  const navigation = useMemo(() => {
    if (isLoading) return []
    return getFilteredNavigation(PLATFORM_ADMIN_NAVIGATION, hasPermission, hasRole)
  }, [hasPermission, hasRole, isLoading])

  // Show loading skeleton while permissions load
  if (isLoading) {
    return (
      <aside className="hidden md:flex w-64 flex-col border-r bg-gradient-to-b from-indigo-900 to-purple-900 text-white">
        <div className="p-4 border-b border-indigo-700/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Platform Admin</h2>
              <p className="text-xs text-indigo-200">God Mode</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-indigo-800/50 rounded-md animate-pulse" />
          ))}
        </nav>
      </aside>
    )
  }

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-gradient-to-b from-indigo-900 to-purple-900 text-white">
      <div className="p-4 border-b border-indigo-700/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Platform Admin</h2>
            <p className="text-xs text-indigo-200">God Mode</p>
          </div>
        </div>
      </div>
      <PlatformAdminSidebarNav navigation={navigation} pathname={pathname} variant="desktop" />
    </aside>
  )
}

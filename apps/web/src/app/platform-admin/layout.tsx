'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { usePermissions } from '@/hooks/usePermissions'
import { AdminHeader } from '@/layout'
import { PlatformAdminSidebar, PlatformAdminMobileNav } from '@/layout'
import { AccessLoading } from '@/ui/access-loading'

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const { isPlatformAdmin, isLoaded, isLoading } = usePermissions()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Wait for auth store hydration first
    if (!isHydrated) return

    // Not authenticated - redirect to signin
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }

    // Wait for roles to load
    if (!isLoaded && !isLoading) {
      return
    }

    // If roles are loaded but user is not platform admin
    if (isLoaded && !isPlatformAdmin) {
      // Redirect to admin dashboard if they have admin access, otherwise home
      router.push('/unauthorized?error=platform_admin_required&from=' + encodeURIComponent(pathname))
      return
    }

    // User is authorized
    if (isLoaded && isPlatformAdmin) {
      setIsAuthorized(true)
    }
  }, [isAuthenticated, isHydrated, isPlatformAdmin, isLoaded, isLoading, pathname, router])

  // Show loading state while checking permissions
  if (!isHydrated || !isAuthenticated || !isLoaded || !isAuthorized) {
    return <AccessLoading message="Verifying platform access..." variant="platform" />
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-100 to-indigo-100 dark:from-slate-950 dark:to-indigo-950">
      <AdminHeader variant="platform-admin" sidebarContent={<PlatformAdminMobileNav />} />
      <div className="flex flex-1 overflow-hidden">
        <PlatformAdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

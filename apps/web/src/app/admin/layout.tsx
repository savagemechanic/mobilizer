'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { usePermissions } from '@/hooks/usePermissions'
import { AdminHeader, AdminSidebar, AdminMobileNav } from '@/layout'
import { AccessLoading } from '@/ui/access-loading'
import { ROUTE_PERMISSIONS } from '@/constants/permissions'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const { canAccessAdmin, hasPermission, isLoaded } = usePermissions()
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
    if (!isLoaded) {
      return
    }

    // Not an admin - redirect to home with error
    if (!canAccessAdmin) {
      router.push('/?error=admin_required')
      return
    }

    // Check route-specific permission
    const requiredPermission = ROUTE_PERMISSIONS[pathname]
    if (requiredPermission && !hasPermission(requiredPermission)) {
      // Redirect to dashboard if they don't have permission for this specific route
      router.push('/admin/dashboard?error=permission_denied')
      return
    }

    // User is authorized
    setIsAuthorized(true)
  }, [isAuthenticated, isHydrated, canAccessAdmin, hasPermission, isLoaded, pathname, router])

  // Show loading state while checking permissions
  if (!isHydrated || !isAuthenticated || !isLoaded || !isAuthorized) {
    return <AccessLoading message="Verifying access..." />
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 dark:bg-slate-950">
      <AdminHeader variant="admin" sidebarContent={<AdminMobileNav />} />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

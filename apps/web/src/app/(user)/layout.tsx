'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { UserHeader, UserSidebar } from '@/layout'
import { AccessLoading } from '@/ui/access-loading'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  useEffect(() => {
    // Wait for hydration before making routing decisions
    if (!isHydrated) return

    if (!isAuthenticated) {
      router.push('/signin')
    }
  }, [isAuthenticated, isHydrated, router])

  // Show loading while hydrating or not authenticated
  if (!isHydrated || !isAuthenticated) {
    return <AccessLoading message="Loading..." />
  }

  return (
    <div className="flex h-screen flex-col">
      <UserHeader />
      <div className="flex flex-1 overflow-hidden">
        <UserSidebar />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="container mx-auto py-6 px-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

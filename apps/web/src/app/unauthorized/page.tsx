'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldX, ArrowLeft, Home, LogIn } from 'lucide-react'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/auth-store'

function UnauthorizedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { highestRole, canAccessAdmin, getDefaultRoute } = usePermissions()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const attemptedPath = searchParams.get('from') || 'this page'
  const errorType = searchParams.get('error')

  const getErrorMessage = () => {
    switch (errorType) {
      case 'admin_required':
        return 'The web dashboard is only available to administrators. Please use the mobile app to access your account.'
      case 'permission_denied':
        return `You don't have the required permissions to access this feature.`
      case 'platform_admin_required':
        return 'This section is only available to Platform Administrators.'
      default:
        return `You don't have permission to access ${attemptedPath}.`
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <ShieldX className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription className="text-base">
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          {highestRole && highestRole !== 'member' && (
            <p className="text-sm text-muted-foreground">
              Your current role:{' '}
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {highestRole.replace('_', ' ').toUpperCase()}
              </span>
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>

            {canAccessAdmin ? (
              <Button
                className="flex-1"
                onClick={() => router.push(getDefaultRoute())}
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            ) : isAuthenticated ? (
              <Button
                className="flex-1"
                onClick={() => router.push('/')}
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={() => router.push('/signin')}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            If you believe this is an error, please contact your administrator.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  )
}

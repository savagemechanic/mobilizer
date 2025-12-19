'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useLazyQuery } from '@apollo/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Smartphone, AlertCircle } from 'lucide-react'
import { LOGIN } from '@/lib/graphql/mutations/auth'
import { GET_USER_ROLES } from '@/lib/graphql/queries/auth'
import { useAuthStore } from '@/store/auth-store'
import { useUserRolesStore, transformUserRolesResponse } from '@/store/user-roles-store'
import { Button } from '@/atoms'
import { Input, Label } from '@/atoms'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type SignInFormData = z.infer<typeof signInSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const setRoles = useUserRolesStore((state) => state.setRoles)
  const [error, setError] = useState<string | null>(null)

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN)
  const [getUserRoles, { loading: rolesLoading }] = useLazyQuery(GET_USER_ROLES)

  const loading = loginLoading || rolesLoading

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  // Show error from redirect (e.g., access denied)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'admin_required') {
        setError('Access Denied: The web dashboard is only available to administrators.')
      } else if (errorParam === 'session_expired') {
        setError('Your session has expired. Please sign in again.')
      }
    }
  }, [searchParams])

  const onSubmit = async (data: SignInFormData) => {
    try {
      setError(null)

      // Step 1: Login
      const loginResult = await loginMutation({
        variables: {
          input: {
            email: data.email,
            password: data.password,
          },
        },
      })

      if (!loginResult.data?.login) {
        setError('Login failed. Please check your credentials.')
        return
      }

      const { accessToken, user } = loginResult.data.login

      // Step 2: Check if user is Platform Admin (from user object)
      if (user.isPlatformAdmin) {
        // Platform Admin - full access, go to platform dashboard
        login(accessToken, user)
        setRoles({
          isPlatformAdmin: true,
          rolesByMovement: {},
          allRoles: ['Platform Admin'],
          isSuperAdmin: true,
          hasAdminRole: true,
        })
        router.push('/platform-admin/dashboard')
        return
      }

      // Step 3: Fetch user roles to check admin access
      const rolesResult = await getUserRoles({
        context: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      })

      const rolesData = rolesResult.data?.getUserRoles || []
      const transformedRoles = transformUserRolesResponse(rolesData)

      // Step 4: Check if user has any admin role
      if (!transformedRoles.hasAdminRole) {
        // Non-admin user - BLOCK web access
        setError(
          'Access Denied: The web dashboard is only available to administrators. Please use the Mobilizer mobile app to access your account.'
        )
        return
      }

      // Step 5: User is authorized - save auth and redirect
      login(accessToken, user)
      setRoles({
        isPlatformAdmin: false,
        ...transformedRoles,
      })

      // Redirect based on role
      if (transformedRoles.isSuperAdmin) {
        router.push('/admin/dashboard')
      } else {
        router.push('/admin/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your Mobilizer admin account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register('password')}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Mobile app info */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-slate-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Regular users
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Please download the Mobilizer mobile app to access your account.
                The web dashboard is for administrators only.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          Forgot password?
        </Link>
        <div className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

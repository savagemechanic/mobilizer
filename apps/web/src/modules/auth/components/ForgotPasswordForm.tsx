'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation } from '@apollo/client'
import { FORGOT_PASSWORD } from '@/lib/graphql/mutations/auth'
import { Button } from '@/atoms'
import { Input, Label } from '@/atoms'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [forgotPasswordMutation, { loading }] = useMutation(FORGOT_PASSWORD)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      const result = await forgotPasswordMutation({
        variables: { email },
      })

      if (result.data?.forgotPassword?.success) {
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
        <CardDescription className="text-center">
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <div className="p-4 text-center bg-green-50 dark:bg-green-900/20 rounded-md">
              <p className="text-green-600 font-medium">Reset link sent!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Check your email for password reset instructions
              </p>
            </div>
            <Link href="/signin" className="block">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Link href="/signin" className="block">
              <Button variant="ghost" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

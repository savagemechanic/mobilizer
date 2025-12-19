'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ResetPasswordForm } from '@/modules/auth'
import { Card, CardContent } from '@/ui/card'

function ResetPasswordFormWrapper() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  return <ResetPasswordForm token={token} />
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    }>
      <ResetPasswordFormWrapper />
    </Suspense>
  )
}

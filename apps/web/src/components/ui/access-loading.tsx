'use client'

import { cn } from '@/lib/utils'

interface AccessLoadingProps {
  message?: string
  variant?: 'default' | 'platform'
}

/**
 * Reusable loading component for access verification
 * DRY: Single component for all layout loading states
 */
export function AccessLoading({
  message = 'Verifying access...',
  variant = 'default'
}: AccessLoadingProps) {
  return (
    <div
      className={cn(
        'flex h-screen items-center justify-center',
        variant === 'platform'
          ? 'bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950'
          : 'bg-slate-50 dark:bg-slate-900'
      )}
    >
      <div className="text-center">
        <div
          className={cn(
            'h-8 w-8 animate-spin rounded-full border-4 border-t-transparent mx-auto mb-4',
            variant === 'platform' ? 'border-indigo-600' : 'border-primary'
          )}
        />
        <p className="text-slate-600 dark:text-slate-400">{message}</p>
      </div>
    </div>
  )
}

export default AccessLoading

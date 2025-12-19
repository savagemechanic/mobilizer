'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button } from '@/ui/button'
import { cn } from '@/lib/utils'

export interface NotificationBellProps {
  variant?: 'admin' | 'platform-admin' | 'user'
  hasUnread?: boolean
  href?: string
  className?: string
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  variant = 'user',
  hasUnread = true,
  href = '/notifications',
  className,
}) => {
  const isPlatformVariant = variant === 'platform-admin'

  const buttonContent = (
    <>
      <Bell className="h-5 w-5" />
      {hasUnread && (
        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
      )}
      <span className="sr-only">Notifications</span>
    </>
  )

  if (variant === 'user') {
    return (
      <Link href={href}>
        <button className={cn('relative p-2 hover:bg-accent rounded-md', className)}>
          {buttonContent}
        </button>
      </Link>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className={cn(
        'relative',
        isPlatformVariant && 'text-indigo-200 hover:text-white hover:bg-indigo-800',
        className
      )}
    >
      <Link href={href}>{buttonContent}</Link>
    </Button>
  )
}

NotificationBell.displayName = 'NotificationBell'

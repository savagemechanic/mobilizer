'use client'

import * as React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/atoms'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const userAvatarVariants = cva('', {
  variants: {
    size: {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-24 w-24 text-2xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export interface UserAvatarProps extends VariantProps<typeof userAvatarVariants> {
  src?: string
  alt?: string
  name?: string
  className?: string
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const UserAvatar = React.forwardRef<HTMLDivElement, UserAvatarProps>(
  ({ src, name, alt, size, className }, ref) => {
    const displayName = alt || name || 'User'
    const initials = getInitials(displayName)

    return (
      <Avatar ref={ref} className={cn(userAvatarVariants({ size }), className)}>
        {src && <AvatarImage src={src} alt={displayName} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    )
  }
)

UserAvatar.displayName = 'UserAvatar'

export { UserAvatar }

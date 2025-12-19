'use client'

import * as React from 'react'
import { Badge } from '@/atoms'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const roleBadgeVariants = cva(
  'border-transparent',
  {
    variants: {
      role: {
        admin: 'bg-blue-500 text-white hover:bg-blue-600',
        leader: 'bg-purple-500 text-white hover:bg-purple-600',
        member: 'bg-gray-500 text-white hover:bg-gray-600',
        superadmin: 'bg-red-500 text-white hover:bg-red-600',
      },
    },
    defaultVariants: {
      role: 'member',
    },
  }
)

export interface RoleBadgeProps extends VariantProps<typeof roleBadgeVariants> {
  className?: string
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  const roleLabels = {
    admin: 'Admin',
    leader: 'Leader',
    member: 'Member',
    superadmin: 'Super Admin',
  }

  return (
    <Badge className={cn(roleBadgeVariants({ role }), className)}>
      {role && roleLabels[role]}
    </Badge>
  )
}

RoleBadge.displayName = 'RoleBadge'

export { RoleBadge }

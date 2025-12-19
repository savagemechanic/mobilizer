'use client'

import * as React from 'react'
import { Badge } from '@/atoms'
import { cn } from '@/lib/utils'

export interface StatusBadgeProps {
  active: boolean
  className?: string
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ active, className }) => {
  return (
    <Badge
      variant={active ? 'success' : 'destructive'}
      className={cn(className)}
    >
      {active ? 'Active' : 'Inactive'}
    </Badge>
  )
}

StatusBadge.displayName = 'StatusBadge'

export { StatusBadge }

'use client'

import * as React from 'react'
import { Crown, Shield, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'

export interface AdminRoleBadgeProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

interface RoleBadgeConfig {
  label: string
  icon: LucideIcon
  className: string
}

export const AdminRoleBadge: React.FC<AdminRoleBadgeProps> = ({ className, size = 'md' }) => {
  const { isPlatformAdmin, isSuperAdmin } = usePermissions()

  const getRoleBadge = (): RoleBadgeConfig => {
    if (isPlatformAdmin) {
      return {
        label: 'Platform Admin',
        icon: Crown,
        className: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
      }
    }
    if (isSuperAdmin) {
      return {
        label: 'Super Admin',
        icon: Shield,
        className: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
      }
    }
    return {
      label: 'Admin',
      icon: User,
      className: 'bg-slate-600 text-white',
    }
  }

  const roleBadge = getRoleBadge()
  const RoleIcon = roleBadge.icon

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  }

  const iconSizeClasses = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        roleBadge.className,
        className
      )}
    >
      <RoleIcon className={iconSizeClasses[size]} />
      {roleBadge.label}
    </div>
  )
}

AdminRoleBadge.displayName = 'AdminRoleBadge'

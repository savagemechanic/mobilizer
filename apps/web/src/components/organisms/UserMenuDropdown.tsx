'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Crown, LogOut, Settings, Shield, User } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { usePermissions } from '@/hooks/usePermissions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Button } from '@/ui/button'
import { cn } from '@/lib/utils'

export interface UserMenuDropdownProps {
  variant?: 'admin' | 'platform-admin' | 'user'
  className?: string
}

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  variant = 'user',
  className,
}) => {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { isPlatformAdmin, isSuperAdmin } = usePermissions()

  const handleLogout = () => {
    logout()
    router.push('/signin')
  }

  const getInitials = () => {
    if (!user) return 'U'
    const first = user.firstName?.[0] || ''
    const last = user.lastName?.[0] || ''
    return `${first}${last}`.toUpperCase() || 'U'
  }

  // Get role badge config
  const getRoleBadge = () => {
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

  const isPlatformVariant = variant === 'platform-admin'
  const showRoleBadge = variant === 'admin' || variant === 'platform-admin'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'relative h-9 w-9 rounded-full',
            isPlatformVariant && 'hover:bg-indigo-800',
            className
          )}
        >
          <Avatar className="h-9 w-9 ring-2 ring-white/20">
            <AvatarImage src={user?.avatar} alt={user?.displayName || 'User'} />
            <AvatarFallback
              className={cn(
                isPlatformVariant
                  ? 'bg-indigo-600 text-white'
                  : 'bg-primary text-primary-foreground'
              )}
            >
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} alt={user?.displayName || 'User'} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              {showRoleBadge && (
                <div
                  className={cn(
                    'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium w-fit',
                    roleBadge.className
                  )}
                >
                  <RoleIcon className="h-2.5 w-2.5" />
                  {roleBadge.label}
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/profile/${user?.id}`} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/edit" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        {isPlatformAdmin && variant !== 'platform-admin' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/platform-admin/dashboard" className="cursor-pointer">
                <Crown className="mr-2 h-4 w-4" />
                Platform Admin
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {(isPlatformAdmin || isSuperAdmin) && variant === 'user' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/dashboard" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

UserMenuDropdown.displayName = 'UserMenuDropdown'

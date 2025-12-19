'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  ChevronRight,
  Crown,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { usePermissions } from '@/hooks/usePermissions'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Button } from '@/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/ui/sheet'
import { cn } from '@/lib/utils'

interface AdminHeaderProps {
  variant?: 'admin' | 'platform-admin'
  sidebarContent?: React.ReactNode
}

// Breadcrumb mapping for routes
const BREADCRUMB_LABELS: Record<string, string> = {
  'admin': 'Admin',
  'platform-admin': 'Platform Admin',
  'dashboard': 'Dashboard',
  'members': 'Members',
  'posts': 'Posts & Feeds',
  'events': 'Events',
  'polls': 'Polls',
  'orgs': 'Support Groups',
  'wallet': 'Wallet',
  'audit': 'Audit Trail',
  'permissions': 'Permissions',
  'movements': 'Movements',
  'super-admins': 'Super Admins',
  'settings': 'Settings',
  'users': 'Users',
}

export function AdminHeader({ variant = 'admin', sidebarContent }: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { isPlatformAdmin, isSuperAdmin, highestRole } = usePermissions()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/signin')
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const getInitials = () => {
    if (!user) return 'U'
    const first = user.firstName?.[0] || ''
    const last = user.lastName?.[0] || ''
    return `${first}${last}`.toUpperCase() || 'U'
  }

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    return segments.map((segment, index) => ({
      label: BREADCRUMB_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      href: '/' + segments.slice(0, index + 1).join('/'),
      isLast: index === segments.length - 1,
    }))
  }

  const breadcrumbs = getBreadcrumbs()

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

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b backdrop-blur-lg supports-[backdrop-filter]:bg-background/80',
        isPlatformVariant
          ? 'bg-gradient-to-r from-indigo-900/95 to-purple-900/95 border-indigo-700 text-white'
          : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700'
      )}
    >
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Mobile Menu Trigger */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'md:hidden',
                isPlatformVariant && 'text-white hover:bg-indigo-800'
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className={cn(
              'w-72 p-0',
              isPlatformVariant
                ? 'bg-gradient-to-b from-indigo-900 to-purple-900 text-white border-indigo-700'
                : 'bg-slate-900 text-white border-slate-700'
            )}
          >
            <SheetHeader className="p-4 border-b border-slate-700/50">
              <SheetTitle className="text-white flex items-center gap-2">
                {isPlatformVariant ? (
                  <>
                    <Crown className="h-5 w-5 text-yellow-400" />
                    Platform Admin
                  </>
                ) : (
                  'Admin Panel'
                )}
              </SheetTitle>
            </SheetHeader>
            <div className="py-4" onClick={() => setMobileMenuOpen(false)}>
              {sidebarContent}
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo / Brand */}
        <Link
          href={isPlatformVariant ? '/platform-admin/dashboard' : '/admin/dashboard'}
          className="flex items-center gap-2 font-bold text-lg"
        >
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              isPlatformVariant
                ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                : 'bg-gradient-to-br from-primary to-primary/80'
            )}
          >
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className={cn(
            'hidden sm:inline-block',
            isPlatformVariant ? 'text-white' : 'text-slate-900 dark:text-white'
          )}>
            Mobilizer
          </span>
        </Link>

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-1 text-sm ml-4">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className={cn(
                  'h-4 w-4',
                  isPlatformVariant ? 'text-indigo-300' : 'text-slate-400'
                )} />
              )}
              {crumb.isLast ? (
                <span className={cn(
                  'font-medium',
                  isPlatformVariant ? 'text-white' : 'text-slate-900 dark:text-white'
                )}>
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className={cn(
                    'transition-colors',
                    isPlatformVariant
                      ? 'text-indigo-200 hover:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Role Badge */}
        <div
          className={cn(
            'hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
            roleBadge.className
          )}
        >
          <RoleIcon className="h-3 w-3" />
          {roleBadge.label}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={cn(
              isPlatformVariant && 'text-indigo-200 hover:text-white hover:bg-indigo-800'
            )}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'relative',
              isPlatformVariant && 'text-indigo-200 hover:text-white hover:bg-indigo-800'
            )}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'relative h-9 w-9 rounded-full',
                  isPlatformVariant && 'hover:bg-indigo-800'
                )}
              >
                <Avatar className="h-9 w-9 ring-2 ring-white/20">
                  <AvatarImage src={user?.avatar} alt={user?.displayName || 'User'} />
                  <AvatarFallback className={cn(
                    isPlatformVariant
                      ? 'bg-indigo-600 text-white'
                      : 'bg-primary text-primary-foreground'
                  )}>
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
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <div className={cn(
                      'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium w-fit',
                      roleBadge.className
                    )}>
                      <RoleIcon className="h-2.5 w-2.5" />
                      {roleBadge.label}
                    </div>
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
              {isPlatformAdmin && (
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
        </div>
      </div>
    </header>
  )
}

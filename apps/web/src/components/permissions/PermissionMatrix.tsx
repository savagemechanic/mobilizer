'use client'

import { useState, useMemo } from 'react'
import { Check, X, Minus, Search, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { PERMISSIONS, ROLES, type Permission, type RoleSlug } from '@/constants/permissions'
import type { User, CustomPermissions } from '@/types'

interface PermissionMatrixProps {
  users: User[]
  onPermissionChange?: (userId: string, permission: Permission, enabled: boolean) => void
  customPermissions?: Record<string, CustomPermissions>
  loading?: boolean
  readOnly?: boolean
}

// Permission categories for grouping - Super Admin manages these for regular admins
const PERMISSION_CATEGORIES = {
  'Content': [
    PERMISSIONS.ADMIN_DASHBOARD,
    PERMISSIONS.ADMIN_MEMBERS,
    PERMISSIONS.ADMIN_POSTS,
    PERMISSIONS.ADMIN_EVENTS,
    PERMISSIONS.ADMIN_POLLS,
  ],
  'Management': [
    PERMISSIONS.ADMIN_SUPPORT_GROUPS,
    PERMISSIONS.ADMIN_WALLET,
  ],
  'System': [
    PERMISSIONS.ADMIN_AUDIT_TRAIL,
    PERMISSIONS.ADMIN_PERMISSIONS,
  ],
}

// Get friendly name for a permission
const getPermissionLabel = (permission: Permission): string => {
  const labels: Record<Permission, string> = {
    [PERMISSIONS.PLATFORM_MOVEMENTS]: 'Movements',
    [PERMISSIONS.PLATFORM_SUPER_ADMINS]: 'Super Admins',
    [PERMISSIONS.PLATFORM_USERS]: 'Users',
    [PERMISSIONS.PLATFORM_SETTINGS]: 'Platform Settings',
    [PERMISSIONS.ADMIN_DASHBOARD]: 'Dashboard',
    [PERMISSIONS.ADMIN_MEMBERS]: 'Members',
    [PERMISSIONS.ADMIN_POSTS]: 'Posts/Feeds',
    [PERMISSIONS.ADMIN_EVENTS]: 'Events',
    [PERMISSIONS.ADMIN_POLLS]: 'Polls',
    [PERMISSIONS.ADMIN_WALLET]: 'Wallet',
    [PERMISSIONS.ADMIN_SUPPORT_GROUPS]: 'Support Groups',
    [PERMISSIONS.ADMIN_AUDIT_TRAIL]: 'Audit Trail',
    [PERMISSIONS.ADMIN_PERMISSIONS]: 'Permissions',
  }
  return labels[permission] || permission
}

// Get default permissions for a role
const getRoleDefaultPermissions = (roleName: string): readonly Permission[] => {
  if (roleName === 'Super Admin') return ROLES.SUPER_ADMIN.permissions
  if (roleName === 'Admin') return ROLES.ADMIN.permissions
  return []
}

// Get user's highest role
const getUserHighestRole = (user: User): string => {
  if (user.isPlatformAdmin) return 'Platform Admin'
  const roles = user.roles || []
  if (roles.some((r) => r.roleName === 'Super Admin')) return 'Super Admin'
  if (roles.some((r) => r.roleName === 'Admin')) return 'Admin'
  return 'Member'
}

export function PermissionMatrix({
  users,
  onPermissionChange,
  customPermissions = {},
  loading = false,
  readOnly = false,
}: PermissionMatrixProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users
    const query = searchQuery.toLowerCase()
    return users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  // Check if user has permission (from role or custom override)
  const hasPermission = (user: User, permission: Permission): 'yes' | 'no' | 'inherited' => {
    // Check custom override first
    const userCustom = customPermissions[user.id]
    if (userCustom && permission in userCustom) {
      return userCustom[permission] ? 'yes' : 'no'
    }

    // Check role-based permissions
    const highestRole = getUserHighestRole(user)
    if (highestRole === 'Platform Admin') return 'inherited'

    const rolePerms = getRoleDefaultPermissions(highestRole)
    return rolePerms.includes(permission) ? 'inherited' : 'no'
  }

  const handleToggle = (user: User, permission: Permission) => {
    if (readOnly || !onPermissionChange) return

    const current = hasPermission(user, permission)
    // Toggle: inherited/yes -> no, no -> yes
    const newValue = current === 'no'
    onPermissionChange(user.id, permission, newValue)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Click cells to toggle custom permissions</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-green-500/20 flex items-center justify-center">
            <Check className="h-3 w-3 text-green-600" />
          </div>
          <span>Granted (custom)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Check className="h-3 w-3 text-slate-400" />
          </div>
          <span>Inherited (from role)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-500/10 flex items-center justify-center">
            <X className="h-3 w-3 text-red-400" />
          </div>
          <span>Denied</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <th className="sticky left-0 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-left font-medium">
                User
              </th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                <th
                  key={category}
                  colSpan={perms.length}
                  className="px-2 py-3 text-center font-medium border-l"
                >
                  {category}
                </th>
              ))}
            </tr>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b">
              <th className="sticky left-0 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-2" />
              <th className="px-4 py-2" />
              {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) =>
                perms.map((perm, idx) => (
                  <th
                    key={perm}
                    className={cn(
                      'px-2 py-2 text-xs font-normal text-muted-foreground',
                      idx === 0 && 'border-l'
                    )}
                  >
                    <div className="writing-mode-vertical transform -rotate-45 origin-left translate-x-2 whitespace-nowrap">
                      {getPermissionLabel(perm)}
                    </div>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const highestRole = getUserHighestRole(user)

              return (
                <tr
                  key={user.id}
                  className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="sticky left-0 bg-white dark:bg-slate-900 px-4 py-3">
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        highestRole === 'Platform Admin' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                        highestRole === 'Super Admin' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                        highestRole === 'Admin' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                        highestRole === 'Member' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      )}
                    >
                      {highestRole}
                    </span>
                  </td>
                  {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) =>
                    perms.map((perm, idx) => {
                      const status = hasPermission(user, perm)
                      const isPlatformAdmin = highestRole === 'Platform Admin'

                      return (
                        <td
                          key={perm}
                          className={cn(
                            'px-2 py-3 text-center',
                            idx === 0 && 'border-l',
                            !readOnly && !isPlatformAdmin && 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                          onClick={() => !isPlatformAdmin && handleToggle(user, perm)}
                        >
                          <div
                            className={cn(
                              'inline-flex h-6 w-6 items-center justify-center rounded',
                              status === 'yes' && 'bg-green-500/20',
                              status === 'inherited' && 'bg-slate-100 dark:bg-slate-800',
                              status === 'no' && 'bg-red-500/10'
                            )}
                          >
                            {status === 'yes' && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                            {status === 'inherited' && (
                              <Check className="h-4 w-4 text-slate-400" />
                            )}
                            {status === 'no' && (
                              <X className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                        </td>
                      )
                    })
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users found matching your search.
        </div>
      )}
    </div>
  )
}

export default PermissionMatrix

import { useMemo } from 'react'
import { PERMISSIONS, ROLES, type Permission, type RoleSlug } from '@/constants/permissions'
import type { User, CustomPermissions } from '@/types'

// Get default permissions for a role
const getRoleDefaultPermissions = (roleName: string): readonly Permission[] => {
  if (roleName === 'Super Admin') return ROLES.SUPER_ADMIN.permissions
  if (roleName === 'Admin') return ROLES.ADMIN.permissions
  if (roleName === 'Leader') return ROLES.LEADER.permissions
  return []
}

// Get user's highest role
const getUserHighestRole = (user: User): string => {
  if (user.isPlatformAdmin) return 'Platform Admin'
  const roles = user.roles || []
  if (roles.some((r) => r.roleName === 'Super Admin')) return 'Super Admin'
  if (roles.some((r) => r.roleName === 'Admin')) return 'Admin'
  if (roles.some((r) => r.roleName === 'Leader')) return 'Leader'
  return 'Member'
}

export interface UsePermissionsProps {
  users: User[]
  customPermissions?: Record<string, CustomPermissions>
}

export function usePermissions({ users, customPermissions = {} }: UsePermissionsProps) {
  // Check if user has permission (from role or custom override)
  const hasPermission = (
    user: User,
    permission: Permission
  ): 'yes' | 'no' | 'inherited' => {
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

  // Get all permissions for a user
  const getUserPermissions = (user: User): Permission[] => {
    const highestRole = getUserHighestRole(user)
    const rolePerms = getRoleDefaultPermissions(highestRole)
    const userCustom = customPermissions[user.id] || {}

    // Start with role permissions
    const permissions = new Set<Permission>(rolePerms)

    // Apply custom overrides
    Object.entries(userCustom).forEach(([perm, enabled]) => {
      if (enabled) {
        permissions.add(perm as Permission)
      } else {
        permissions.delete(perm as Permission)
      }
    })

    return Array.from(permissions)
  }

  // Check if current user can manage permissions for target user
  const canManageUserPermissions = (currentUser: User, targetUser: User): boolean => {
    const currentRole = getUserHighestRole(currentUser)
    const targetRole = getUserHighestRole(targetUser)

    // Platform Admin can manage everyone
    if (currentRole === 'Platform Admin') return true

    // Super Admin can manage Admins, Leaders, and Members
    if (currentRole === 'Super Admin') {
      return ['Admin', 'Leader', 'Member'].includes(targetRole)
    }

    // Regular admins cannot manage permissions
    return false
  }

  // Get users grouped by role
  const usersByRole = useMemo(() => {
    const grouped: Record<string, User[]> = {
      'Platform Admin': [],
      'Super Admin': [],
      'Admin': [],
      'Leader': [],
      'Member': [],
    }

    users.forEach((user) => {
      const role = getUserHighestRole(user)
      grouped[role].push(user)
    })

    return grouped
  }, [users])

  return {
    hasPermission,
    getUserPermissions,
    getUserHighestRole,
    canManageUserPermissions,
    usersByRole,
  }
}

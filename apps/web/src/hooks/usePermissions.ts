'use client'

import { useCallback, useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useUserRolesStore } from '@/store/user-roles-store'
import { PERMISSIONS, ROLES, ROUTE_PERMISSIONS, type Permission, type RoleSlug } from '@/constants/permissions'

/**
 * Custom hook for permission checking
 * Clean interface for components - Single Responsibility Principle
 */
export const usePermissions = () => {
  const user = useAuthStore((state) => state.user)
  const authHydrated = useAuthStore((state) => state.isHydrated)
  const {
    isPlatformAdmin: isPlatformAdminRole,
    isSuperAdmin,
    hasAdminRole,
    customPermissions,
    isLoaded: rolesLoaded,
    isLoading,
    isHydrated: rolesHydrated,
  } = useUserRolesStore()

  // Both stores must be hydrated for isLoaded to be true
  const isLoaded = authHydrated && rolesHydrated && rolesLoaded

  // Combine isPlatformAdmin from both sources (user object and roles store)
  const isPlatformAdmin = isPlatformAdminRole || (user as any)?.isPlatformAdmin

  // Compute effective permissions
  // Platform Admin ONLY gets platform permissions (movements, super admins, settings)
  // Platform Admin does NOT see admin sidebar - they use platform-admin routes only
  const effectivePermissions = useMemo(() => {
    const permissions = new Set<Permission>()

    if (isPlatformAdmin) {
      // Platform Admin only gets platform-level permissions
      ROLES.PLATFORM_ADMIN.permissions.forEach((p) => permissions.add(p))
      return Array.from(permissions)
    }

    if (isSuperAdmin) {
      ROLES.SUPER_ADMIN.permissions.forEach((p) => permissions.add(p))
    } else if (hasAdminRole) {
      ROLES.ADMIN.permissions.forEach((p) => permissions.add(p))
    }

    // Apply custom overrides
    if (customPermissions) {
      Object.entries(customPermissions).forEach(([perm, enabled]) => {
        if (enabled) permissions.add(perm as Permission)
        else permissions.delete(perm as Permission)
      })
    }

    return Array.from(permissions)
  }, [isPlatformAdmin, isSuperAdmin, hasAdminRole, customPermissions])

  // Permission check methods
  const hasPermission = useCallback(
    (permission: Permission | null | undefined): boolean => {
      if (!permission) return true
      return effectivePermissions.includes(permission)
    },
    [effectivePermissions]
  )

  const hasAnyPermission = useCallback(
    (perms: Permission[] | null | undefined): boolean => {
      if (!perms?.length) return true
      return perms.some((p) => effectivePermissions.includes(p))
    },
    [effectivePermissions]
  )

  const hasAllPermissions = useCallback(
    (perms: Permission[] | null | undefined): boolean => {
      if (!perms?.length) return true
      return perms.every((p) => effectivePermissions.includes(p))
    },
    [effectivePermissions]
  )

  // Role checks
  const hasRole = useCallback(
    (roleSlug: RoleSlug): boolean => {
      if (roleSlug === 'platform_admin') return isPlatformAdmin
      if (roleSlug === 'super_admin') return isSuperAdmin
      if (roleSlug === 'admin') return hasAdminRole
      return false
    },
    [isPlatformAdmin, isSuperAdmin, hasAdminRole]
  )

  // Check route access
  const canAccessRoute = useCallback(
    (path: string): boolean => {
      // Find matching route permission (handle dynamic routes)
      const exactMatch = ROUTE_PERMISSIONS[path]
      if (exactMatch) {
        return hasPermission(exactMatch)
      }

      // Check for prefix matches (e.g., /admin/wallet/transactions -> /admin/wallet)
      const pathParts = path.split('/')
      while (pathParts.length > 1) {
        pathParts.pop()
        const parentPath = pathParts.join('/')
        const parentPermission = ROUTE_PERMISSIONS[parentPath]
        if (parentPermission) {
          return hasPermission(parentPermission)
        }
      }

      return true // No permission required for unmapped routes
    },
    [hasPermission]
  )

  // Get redirect path based on role
  const getDefaultRoute = useCallback((): string => {
    if (isPlatformAdmin) return '/platform-admin/dashboard'
    if (isSuperAdmin || hasAdminRole) return '/admin/dashboard'
    return '/' // Non-admins go to home
  }, [isPlatformAdmin, isSuperAdmin, hasAdminRole])

  // Computed values
  const highestRole = useMemo((): RoleSlug => {
    if (isPlatformAdmin) return 'platform_admin'
    if (isSuperAdmin) return 'super_admin'
    if (hasAdminRole) return 'admin'
    return 'member'
  }, [isPlatformAdmin, isSuperAdmin, hasAdminRole])

  // Platform Admin uses /platform-admin routes, NOT /admin routes
  const canAccessAdmin = isSuperAdmin || hasAdminRole
  const canAccessPlatformAdmin = isPlatformAdmin
  const isRegularAdmin = hasAdminRole && !isSuperAdmin && !isPlatformAdmin

  return {
    // Loading state
    isLoading,
    isLoaded,

    // Role flags
    isPlatformAdmin,
    isSuperAdmin,
    isAdmin: hasAdminRole,
    isRegularAdmin,
    canAccessAdmin,
    canAccessPlatformAdmin,
    highestRole,

    // Permissions
    effectivePermissions,

    // Methods
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canAccessRoute,
    getDefaultRoute,

    // Constants
    PERMISSIONS,
    ROLES,
    ROUTE_PERMISSIONS,
  }
}

export default usePermissions

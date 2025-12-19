import { useAuthStore } from '@/store/auth-store'
import { useUserRolesStore } from '@/store/user-roles-store'
import type { User } from '@/types'

/**
 * Hook to access authentication state and actions
 * Wraps the auth store to provide a clean API for auth operations
 */
export function useAuth() {
  // Auth state
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  // Auth actions
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const updateUser = useAuthStore((state) => state.updateUser)

  // User roles state
  const isPlatformAdmin = useUserRolesStore((state) => state.isPlatformAdmin)
  const isSuperAdmin = useUserRolesStore((state) => state.isSuperAdmin)
  const hasAdminRole = useUserRolesStore((state) => state.hasAdminRole)
  const isRegularAdmin = useUserRolesStore((state) => state.isRegularAdmin)
  const rolesByMovement = useUserRolesStore((state) => state.rolesByMovement)
  const allRoles = useUserRolesStore((state) => state.allRoles)

  // Roles actions
  const setRoles = useUserRolesStore((state) => state.setRoles)
  const clearRoles = useUserRolesStore((state) => state.clearRoles)

  /**
   * Full logout - clears both auth and roles state
   */
  const fullLogout = () => {
    logout()
    clearRoles()
  }

  /**
   * Login with user roles
   */
  const loginWithRoles = (
    token: string,
    user: User,
    rolesData: {
      isPlatformAdmin?: boolean
      rolesByMovement: any
      allRoles: string[]
      isSuperAdmin: boolean
      hasAdminRole: boolean
    }
  ) => {
    login(token, user)
    setRoles(rolesData)
  }

  return {
    // Auth state
    user,
    token,
    isAuthenticated,
    isHydrated,

    // Roles state
    isPlatformAdmin,
    isSuperAdmin,
    hasAdminRole,
    isRegularAdmin,
    rolesByMovement,
    allRoles,

    // Actions
    login,
    logout: fullLogout,
    updateUser,
    loginWithRoles,

    // Computed values
    canAccessPlatformAdmin: isPlatformAdmin,
    canAccessSuperAdmin: isPlatformAdmin || isSuperAdmin,
    canAccessAdmin: isPlatformAdmin || isSuperAdmin || hasAdminRole,
  }
}

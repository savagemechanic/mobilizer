import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RolesByMovement, CustomPermissions, UserRole } from '@/types'

interface UserRolesState {
  // Role flags
  isPlatformAdmin: boolean
  isSuperAdmin: boolean
  hasAdminRole: boolean
  isRegularAdmin: boolean

  // Role data
  rolesByMovement: RolesByMovement
  allRoles: string[]

  // Permissions
  customPermissions: CustomPermissions
  permissionsLoaded: boolean

  // Loading states
  isLoading: boolean
  isLoaded: boolean
  isHydrated: boolean
  error: string | null

  // Actions
  setRoles: (data: {
    isPlatformAdmin?: boolean
    rolesByMovement: RolesByMovement
    allRoles: string[]
    isSuperAdmin: boolean
    hasAdminRole: boolean
  }) => void
  setCustomPermissions: (permissions: CustomPermissions) => void
  setCustomPermission: (permission: string, enabled: boolean) => void
  setIsPlatformAdmin: (isPlatformAdmin: boolean) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearRoles: () => void
  setHydrated: () => void
}

const ROLE_NAMES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
}

const initialState = {
  isPlatformAdmin: false,
  isSuperAdmin: false,
  hasAdminRole: false,
  isRegularAdmin: false,
  rolesByMovement: {},
  allRoles: [],
  customPermissions: {},
  permissionsLoaded: false,
  isLoading: false,
  isLoaded: false,
  isHydrated: false,
  error: null,
}

export const useUserRolesStore = create<UserRolesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setRoles: (data) => {
        const isSuperAdmin = data.isSuperAdmin
        const hasAdminRole = data.hasAdminRole
        const isPlatformAdmin = data.isPlatformAdmin || false

        set({
          isPlatformAdmin,
          isSuperAdmin,
          hasAdminRole,
          isRegularAdmin: hasAdminRole && !isSuperAdmin && !isPlatformAdmin,
          rolesByMovement: data.rolesByMovement,
          allRoles: data.allRoles,
          isLoaded: true,
          isLoading: false,
        })
      },

      setCustomPermissions: (permissions) => {
        set({
          customPermissions: permissions,
          permissionsLoaded: true,
        })
      },

      setCustomPermission: (permission, enabled) => {
        const current = get().customPermissions
        set({
          customPermissions: {
            ...current,
            [permission]: enabled,
          },
        })
      },

      setIsPlatformAdmin: (isPlatformAdmin) => {
        set({ isPlatformAdmin })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setError: (error) => {
        set({ error, isLoading: false })
      },

      clearRoles: () => {
        set({ ...initialState, isHydrated: true })
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'user-roles-storage',
      partialize: (state) => ({
        isPlatformAdmin: state.isPlatformAdmin,
        isSuperAdmin: state.isSuperAdmin,
        hasAdminRole: state.hasAdminRole,
        isRegularAdmin: state.isRegularAdmin,
        rolesByMovement: state.rolesByMovement,
        allRoles: state.allRoles,
        customPermissions: state.customPermissions,
        isLoaded: state.isLoaded,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)

// Helper function to transform API response to store format
export const transformUserRolesResponse = (
  data: Array<{
    movement_id: string
    roles: Array<{
      role_id: string
      role_name: string
      support_groups?: Array<{ id: string; name: string }>
    }>
  }>
): {
  rolesByMovement: RolesByMovement
  allRoles: string[]
  isSuperAdmin: boolean
  hasAdminRole: boolean
} => {
  const rolesByMovement: RolesByMovement = {}
  const allRoles = new Set<string>()
  let isSuperAdmin = false
  let hasAdminRole = false

  data.forEach((movement) => {
    const movementId = movement.movement_id
    const roles: UserRole[] = movement.roles.map((role) => ({
      id: role.role_id,
      roleName: role.role_name,
      movementId,
      supportGroups: role.support_groups || [],
    }))

    rolesByMovement[movementId] = roles

    roles.forEach((role) => {
      allRoles.add(role.roleName)
      if (role.roleName === ROLE_NAMES.SUPER_ADMIN) {
        isSuperAdmin = true
        hasAdminRole = true
      }
      if (role.roleName === ROLE_NAMES.ADMIN) {
        hasAdminRole = true
      }
    })
  })

  return {
    rolesByMovement,
    allRoles: Array.from(allRoles),
    isSuperAdmin,
    hasAdminRole,
  }
}

// Selectors
export const selectCanAccessSuperAdminMenus = (state: UserRolesState) =>
  state.isPlatformAdmin || state.isSuperAdmin

export const selectCanAccessPlatformAdminMenus = (state: UserRolesState) =>
  state.isPlatformAdmin

export const selectCanAccessAdmin = (state: UserRolesState) =>
  state.isPlatformAdmin || state.isSuperAdmin || state.hasAdminRole

export { ROLE_NAMES }

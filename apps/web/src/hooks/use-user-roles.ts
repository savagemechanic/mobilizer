'use client'

import { useQuery } from '@apollo/client'
import { useAuthStore } from '@/store/auth-store'
import { GET_USER_ROLES } from '@/lib/graphql/queries/auth'

export interface SupportGroupInfo {
  id: string
  name: string
}

export interface RoleInfo {
  role_id: string
  role_name: string
  support_groups?: SupportGroupInfo[]
}

export interface UserRolesResponse {
  movement_id: string
  movement_name: string
  roles: RoleInfo[]
}

export interface LeaderInfo {
  level: 'STATE' | 'LGA' | 'WARD' | 'POLLING_UNIT'
  stateId?: string
  lgaId?: string
  wardId?: string
  pollingUnitId?: string
}

export interface UserAdminScope {
  isPlatformAdmin: boolean
  isSuperAdmin: boolean
  isSupportGroupAdmin: boolean
  isLeader: boolean

  // For Super Admin: auto-select movement
  movementId?: string
  movementName?: string

  // For Support Group Admin: auto-select movement and support group
  supportGroupId?: string
  supportGroupName?: string

  // For Leaders: location constraints
  leaderInfo?: LeaderInfo

  // All roles across movements
  allRoles: UserRolesResponse[]
}

export function useUserRoles(movementId?: string | null) {
  const user = useAuthStore((state) => state.user)

  const { data, loading, error, refetch } = useQuery(GET_USER_ROLES, {
    variables: { movementId: movementId || undefined },
    skip: !user,
  })

  const userRoles: UserRolesResponse[] = data?.getUserRoles || []

  return {
    userRoles,
    loading,
    error,
    refetch,
  }
}

/**
 * Determine user's admin scope and constraints
 */
export function getUserAdminScope(
  user: any,
  userRoles: UserRolesResponse[]
): UserAdminScope {
  const scope: UserAdminScope = {
    isPlatformAdmin: user?.isPlatformAdmin || false,
    isSuperAdmin: false,
    isSupportGroupAdmin: false,
    isLeader: false,
    allRoles: userRoles,
  }

  // Platform Admin has no restrictions
  if (scope.isPlatformAdmin) {
    return scope
  }

  // Check if user is Super Admin (has Super Admin role in any movement)
  const superAdminRole = userRoles.find((mr) =>
    mr.roles.some((r) => r.role_name === 'Super Admin')
  )

  if (superAdminRole) {
    scope.isSuperAdmin = true
    scope.movementId = superAdminRole.movement_id
    scope.movementName = superAdminRole.movement_name

    // If user is Super Admin of only one movement, return early
    if (userRoles.length === 1 && userRoles[0].roles.length === 1) {
      return scope
    }
  }

  // Check if user is Support Group Admin (has Admin role with specific support groups)
  const adminRoles = userRoles.flatMap((mr) =>
    mr.roles
      .filter((r) => r.role_name === 'Admin' && r.support_groups && r.support_groups.length > 0)
      .map((r) => ({ ...r, movementId: mr.movement_id, movementName: mr.movement_name }))
  )

  if (adminRoles.length > 0) {
    scope.isSupportGroupAdmin = true

    // If admin of only one movement and one support group, auto-select
    if (adminRoles.length === 1 && adminRoles[0].support_groups && adminRoles[0].support_groups.length === 1) {
      scope.movementId = adminRoles[0].movementId
      scope.movementName = adminRoles[0].movementName
      scope.supportGroupId = adminRoles[0].support_groups[0].id
      scope.supportGroupName = adminRoles[0].support_groups[0].name
    }
  }

  // Note: Leader information would come from OrgMembership data
  // which is not currently part of the user roles query
  // This would need to be fetched separately if needed

  return scope
}

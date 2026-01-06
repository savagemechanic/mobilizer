/**
 * Permission Constants - Single Source of Truth
 * Following SOLID principles for role-based access control
 *
 * Role Hierarchy:
 * - Platform Admin: CRUD movements, assign/manage super admins, platform settings
 * - Super Admin: Support groups, events, audit trail, permissions, wallet, members, posts, polls
 * - Regular Admin: Polls, events, feeds/posts, members (NO: permissions, audit trail, wallet, support groups)
 */

// Feature permissions - granular control
export const PERMISSIONS = {
  // Platform Admin Only - Platform-level management
  PLATFORM_MOVEMENTS: 'platform:movements',
  PLATFORM_SUPER_ADMINS: 'platform:super_admins',
  PLATFORM_USERS: 'platform:users',
  PLATFORM_SETTINGS: 'platform:settings',

  // Super Admin + Regular Admin Features
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_MEMBERS: 'admin:members',
  ADMIN_POSTS: 'admin:posts',
  ADMIN_EVENTS: 'admin:events',

  // Super Admin Only Features
  ADMIN_WALLET: 'admin:wallet',
  ADMIN_SUPPORT_GROUPS: 'admin:support_groups',
  ADMIN_AUDIT_TRAIL: 'admin:audit_trail',
  ADMIN_PERMISSIONS: 'admin:permissions',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Role definitions with default permissions
export const ROLES = {
  PLATFORM_ADMIN: {
    name: 'Platform Admin',
    slug: 'platform_admin',
    level: 0, // Highest - God mode
    permissions: [
      // Platform-level only
      PERMISSIONS.PLATFORM_MOVEMENTS,
      PERMISSIONS.PLATFORM_SUPER_ADMINS,
      PERMISSIONS.PLATFORM_USERS,
      PERMISSIONS.PLATFORM_SETTINGS,
    ] as Permission[],
  },
  SUPER_ADMIN: {
    name: 'Super Admin',
    slug: 'super_admin',
    level: 1,
    permissions: [
      // All admin features
      PERMISSIONS.ADMIN_DASHBOARD,
      PERMISSIONS.ADMIN_MEMBERS,
      PERMISSIONS.ADMIN_POSTS,
      PERMISSIONS.ADMIN_EVENTS,
      // Super Admin exclusive
      PERMISSIONS.ADMIN_WALLET,
      PERMISSIONS.ADMIN_SUPPORT_GROUPS,
      PERMISSIONS.ADMIN_AUDIT_TRAIL,
      PERMISSIONS.ADMIN_PERMISSIONS,
    ] as Permission[],
  },
  ADMIN: {
    name: 'Admin',
    slug: 'admin',
    level: 2,
    permissions: [
      // Basic admin features only
      PERMISSIONS.ADMIN_DASHBOARD,
      PERMISSIONS.ADMIN_MEMBERS,
      PERMISSIONS.ADMIN_POSTS,
      PERMISSIONS.ADMIN_EVENTS,
      // NO: ADMIN_WALLET, ADMIN_SUPPORT_GROUPS, ADMIN_AUDIT_TRAIL, ADMIN_PERMISSIONS
    ] as Permission[],
  },
  LEADER: {
    name: 'Leader',
    slug: 'leader',
    level: 2.5, // Between Admin (2) and Member (3)
    permissions: [
      // Leaders can view dashboard and manage members/posts in their geographic scope
      PERMISSIONS.ADMIN_DASHBOARD,
      PERMISSIONS.ADMIN_MEMBERS, // Scoped to geographic area
      PERMISSIONS.ADMIN_POSTS, // Scoped to geographic area
      // NO: ADMIN_EVENTS, ADMIN_POLLS, ADMIN_WALLET, etc.
    ] as Permission[],
  },
  MEMBER: {
    name: 'Member',
    slug: 'member',
    level: 3,
    permissions: [] as Permission[], // No admin permissions - mobile only
  },
} as const

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES]['slug']

// Route to permission mapping
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  // Admin routes
  '/admin/dashboard': PERMISSIONS.ADMIN_DASHBOARD,
  '/admin/members': PERMISSIONS.ADMIN_MEMBERS,
  '/admin/posts': PERMISSIONS.ADMIN_POSTS,
  '/admin/events': PERMISSIONS.ADMIN_EVENTS,
  // Super Admin only routes
  '/admin/wallet': PERMISSIONS.ADMIN_WALLET,
  '/admin/orgs': PERMISSIONS.ADMIN_SUPPORT_GROUPS,
  '/admin/audit': PERMISSIONS.ADMIN_AUDIT_TRAIL,
  '/admin/permissions': PERMISSIONS.ADMIN_PERMISSIONS,
  // Platform Admin routes
  '/platform-admin/dashboard': PERMISSIONS.PLATFORM_MOVEMENTS,
  '/platform-admin/movements': PERMISSIONS.PLATFORM_MOVEMENTS,
  '/platform-admin/super-admins': PERMISSIONS.PLATFORM_SUPER_ADMINS,
  '/platform-admin/users': PERMISSIONS.PLATFORM_USERS,
  '/platform-admin/posts': PERMISSIONS.PLATFORM_MOVEMENTS,
  '/platform-admin/events': PERMISSIONS.PLATFORM_MOVEMENTS,
  '/platform-admin/audit': PERMISSIONS.PLATFORM_SETTINGS,
  '/platform-admin/permissions': PERMISSIONS.PLATFORM_SETTINGS,
  '/platform-admin/settings': PERMISSIONS.PLATFORM_SETTINGS,
}

/**
 * Get permissions for a given role slug
 */
export const getPermissionsForRole = (roleSlug: RoleSlug): readonly Permission[] => {
  const role = Object.values(ROLES).find((r) => r.slug === roleSlug)
  return role ? role.permissions : []
}

/**
 * Check if a role has a specific permission
 */
export const roleHasPermission = (roleSlug: RoleSlug, permission: Permission): boolean => {
  const permissions = getPermissionsForRole(roleSlug)
  return permissions.includes(permission)
}

/**
 * Get role level (lower is higher authority)
 */
export const getRoleLevel = (roleSlug: RoleSlug): number => {
  const role = Object.values(ROLES).find((r) => r.slug === roleSlug)
  return role ? role.level : 999
}

/**
 * Compare two roles, returns true if role1 has higher or equal authority
 */
export const hasHigherOrEqualAuthority = (role1: RoleSlug, role2: RoleSlug): boolean => {
  return getRoleLevel(role1) <= getRoleLevel(role2)
}

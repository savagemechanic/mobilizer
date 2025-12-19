import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Wallet,
  Building2,
  Shield,
  ClipboardList,
  Globe,
  UserCog,
  Settings,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'
import { PERMISSIONS, type Permission, type RoleSlug } from '@/constants/permissions'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  href: string
  permission?: Permission
  roles: RoleSlug[]
}

export interface NavSection {
  id: string
  label: string
  type: 'section'
  roles: RoleSlug[]
  items: NavItem[]
}

/**
 * Platform Admin Navigation Items
 * Only visible to Platform Administrators
 * Platform Admin manages: Movements, Super Admins, Platform Settings
 */
export const PLATFORM_ADMIN_NAVIGATION: NavSection[] = [
  {
    id: 'platform_section',
    label: 'Platform Management',
    type: 'section',
    roles: ['platform_admin'],
    items: [
      {
        id: 'platform_dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/platform-admin/dashboard',
        permission: PERMISSIONS.PLATFORM_MOVEMENTS,
        roles: ['platform_admin'],
      },
      {
        id: 'movements',
        label: 'Movements',
        icon: Globe,
        href: '/platform-admin/movements',
        permission: PERMISSIONS.PLATFORM_MOVEMENTS,
        roles: ['platform_admin'],
      },
      {
        id: 'super_admins',
        label: 'Super Admins',
        icon: UserCog,
        href: '/platform-admin/super-admins',
        permission: PERMISSIONS.PLATFORM_SUPER_ADMINS,
        roles: ['platform_admin'],
      },
      {
        id: 'platform_users',
        label: 'Users',
        icon: Users,
        href: '/platform-admin/users',
        permission: PERMISSIONS.PLATFORM_USERS,
        roles: ['platform_admin'],
      },
      {
        id: 'platform_settings',
        label: 'Settings',
        icon: Settings,
        href: '/platform-admin/settings',
        permission: PERMISSIONS.PLATFORM_SETTINGS,
        roles: ['platform_admin'],
      },
    ],
  },
]

/**
 * Admin Navigation Items
 * Super Admin: All admin features + wallet, support groups, audit trail, permissions
 * Regular Admin: Dashboard, members, posts, events, polls only
 */
export const ADMIN_NAVIGATION: NavSection[] = [
  {
    id: 'content_section',
    label: 'Content',
    type: 'section',
    roles: ['super_admin', 'admin'],
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/admin/dashboard',
        permission: PERMISSIONS.ADMIN_DASHBOARD,
        roles: ['super_admin', 'admin'],
      },
      {
        id: 'members',
        label: 'Members',
        icon: Users,
        href: '/admin/members',
        permission: PERMISSIONS.ADMIN_MEMBERS,
        roles: ['super_admin', 'admin'],
      },
      {
        id: 'posts',
        label: 'Posts/Feeds',
        icon: FileText,
        href: '/admin/posts',
        permission: PERMISSIONS.ADMIN_POSTS,
        roles: ['super_admin', 'admin'],
      },
      {
        id: 'events',
        label: 'Events',
        icon: Calendar,
        href: '/admin/events',
        permission: PERMISSIONS.ADMIN_EVENTS,
        roles: ['super_admin', 'admin'],
      },
      {
        id: 'polls',
        label: 'Polls',
        icon: BarChart3,
        href: '/admin/polls',
        permission: PERMISSIONS.ADMIN_POLLS,
        roles: ['super_admin', 'admin'],
      },
    ],
  },
  {
    id: 'super_admin_section',
    label: 'Management',
    type: 'section',
    roles: ['super_admin'],
    items: [
      {
        id: 'support_groups',
        label: 'Support Groups',
        icon: Building2,
        href: '/admin/orgs',
        permission: PERMISSIONS.ADMIN_SUPPORT_GROUPS,
        roles: ['super_admin'],
      },
      {
        id: 'wallet',
        label: 'Wallet',
        icon: Wallet,
        href: '/admin/wallet',
        permission: PERMISSIONS.ADMIN_WALLET,
        roles: ['super_admin'],
      },
    ],
  },
  {
    id: 'system_section',
    label: 'System',
    type: 'section',
    roles: ['super_admin'],
    items: [
      {
        id: 'audit_trail',
        label: 'Audit Trail',
        icon: ClipboardList,
        href: '/admin/audit',
        permission: PERMISSIONS.ADMIN_AUDIT_TRAIL,
        roles: ['super_admin'],
      },
      {
        id: 'permissions',
        label: 'Permissions',
        icon: Shield,
        href: '/admin/permissions',
        permission: PERMISSIONS.ADMIN_PERMISSIONS,
        roles: ['super_admin'],
      },
    ],
  },
]

/**
 * Get filtered navigation items based on user's permissions and roles
 */
export const getFilteredNavigation = (
  sections: NavSection[],
  hasPermission: (permission: Permission | undefined) => boolean,
  hasRole: (role: RoleSlug) => boolean
): NavSection[] => {
  return sections
    .filter((section) => {
      // Check if user has any role that can see this section
      return section.roles.some((role) => hasRole(role))
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Check permission first
        if (item.permission && !hasPermission(item.permission)) return false
        // Then check roles
        return item.roles.some((role) => hasRole(role))
      }),
    }))
    .filter((section) => section.items.length > 0) // Only show sections with visible items
}

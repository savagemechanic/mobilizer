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
 * Consistent structure with Admin navigation but at platform level
 * Platform Admin manages: Movements, Super Admins, Support Groups, Platform Settings
 */
export const PLATFORM_ADMIN_NAVIGATION: NavSection[] = [
  {
    id: 'main_section',
    label: 'Overview',
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
        id: 'platform_users',
        label: 'Members',
        icon: Users,
        href: '/platform-admin/users',
        permission: PERMISSIONS.PLATFORM_USERS,
        roles: ['platform_admin'],
      },
      {
        id: 'platform_posts',
        label: 'Post Management',
        icon: FileText,
        href: '/platform-admin/posts',
        permission: PERMISSIONS.PLATFORM_MOVEMENTS,
        roles: ['platform_admin'],
      },
      {
        id: 'platform_events',
        label: 'Events',
        icon: Calendar,
        href: '/platform-admin/events',
        permission: PERMISSIONS.PLATFORM_MOVEMENTS,
        roles: ['platform_admin'],
      },
    ],
  },
  {
    id: 'organizations_section',
    label: 'Organizations',
    type: 'section',
    roles: ['platform_admin'],
    items: [
      {
        id: 'movements',
        label: 'Movements',
        icon: Globe,
        href: '/platform-admin/movements',
        permission: PERMISSIONS.PLATFORM_MOVEMENTS,
        roles: ['platform_admin'],
      },
      {
        id: 'platform_support_groups',
        label: 'Support Groups',
        icon: Building2,
        href: '/platform-admin/support-groups',
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
    ],
  },
  {
    id: 'management_section',
    label: 'Management',
    type: 'section',
    roles: ['platform_admin'],
    items: [
      {
        id: 'platform_audit',
        label: 'Audit Trail',
        icon: ClipboardList,
        href: '/platform-admin/audit',
        permission: PERMISSIONS.PLATFORM_SETTINGS,
        roles: ['platform_admin'],
      },
      {
        id: 'platform_permissions',
        label: 'Permissions',
        icon: Shield,
        href: '/platform-admin/permissions',
        permission: PERMISSIONS.PLATFORM_SETTINGS,
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
 * Consistent sidebar structure across all admin types:
 * - Dashboard, Members, Post Management, Events (Main section)
 * - Support Groups (Organizations section)
 * - Wallet, Audit Trail, Permissions (Management section)
 *
 * Super Admin: All features
 * Regular Admin: Main section only (Dashboard, Members, Posts, Events)
 */
export const ADMIN_NAVIGATION: NavSection[] = [
  {
    id: 'main_section',
    label: 'Overview',
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
        label: 'Post Management',
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
    ],
  },
  {
    id: 'support_groups_section',
    label: 'Support Groups',
    type: 'section',
    roles: ['super_admin'],
    items: [
      {
        id: 'support_groups',
        label: 'All Groups',
        icon: Building2,
        href: '/admin/orgs',
        permission: PERMISSIONS.ADMIN_SUPPORT_GROUPS,
        roles: ['super_admin'],
      },
    ],
  },
  {
    id: 'management_section',
    label: 'Management',
    type: 'section',
    roles: ['super_admin'],
    items: [
      {
        id: 'wallet',
        label: 'Wallet',
        icon: Wallet,
        href: '/admin/wallet',
        permission: PERMISSIONS.ADMIN_WALLET,
        roles: ['super_admin'],
      },
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

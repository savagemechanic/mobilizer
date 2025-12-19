import type { Permission, RoleSlug } from '@/constants/permissions'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  middleName?: string
  displayName?: string
  avatar?: string
  bio?: string
  phoneNumber?: string
  isEmailVerified: boolean
  isActive: boolean
  createdAt: string
  // Role-based fields
  isPlatformAdmin?: boolean
  roles?: UserRole[]
}

export interface UserRole {
  id: string
  roleName: string
  movementId: string
  movementName?: string
  supportGroups?: SupportGroup[]
}

export interface SupportGroup {
  id: string
  name: string
}

export interface RolesByMovement {
  [movementId: string]: UserRole[]
}

export interface CustomPermissions {
  [permission: string]: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface Post {
  id: string
  content: string
  author: User
  organizationId?: string
  likes: number
  comments: number
  createdAt: string
  updatedAt: string
  liked?: boolean
}

export interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location?: string
  organizationId?: string
  createdBy: User
  attendees: User[]
  createdAt: string
}

export interface Message {
  id: string
  content: string
  sender: User
  conversationId: string
  createdAt: string
  read: boolean
}

export interface Conversation {
  id: string
  participants: User[]
  lastMessage?: Message
  updatedAt: string
}

export interface Organization {
  id: string
  name: string
  description?: string
  logo?: string
  memberCount: number
  createdAt: string
}

export interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'event' | 'message'
  content: string
  read: boolean
  createdAt: string
  link?: string
}

export interface Movement {
  id: string
  name: string
  description?: string
  logo?: string
  memberCount: number
  supportGroupCount: number
  createdAt: string
  isActive: boolean
}

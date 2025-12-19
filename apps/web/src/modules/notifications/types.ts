import { NotificationType } from '@mobilizer/shared'

export interface Notification {
  __typename?: string
  id: string
  title: string
  message: string | null
  type: NotificationType
  link: string | null
  isRead: boolean
  readAt: Date | null
  createdAt: Date
  userId: string
}

export interface NotificationsData {
  notifications: Notification[]
}

export interface GetNotificationsVariables {
  limit?: number
  offset?: number
}

export interface MarkNotificationReadVariables {
  notificationId: string
}

export interface MarkNotificationReadData {
  markNotificationRead: Notification
}

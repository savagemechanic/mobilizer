import { gql } from '@apollo/client'

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($notificationId: String!) {
    markNotificationRead(notificationId: $notificationId) {
      id
      title
      message
      type
      link
      isRead
      readAt
      createdAt
      userId
    }
  }
`

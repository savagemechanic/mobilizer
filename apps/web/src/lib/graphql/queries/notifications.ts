import { gql } from '@apollo/client'

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($limit: Float, $offset: Float) {
    notifications(limit: $limit, offset: $offset) {
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

export const GET_UNREAD_NOTIFICATION_COUNT = gql`
  query GetUnreadNotificationCount {
    notifications(limit: 1000, offset: 0) {
      id
      isRead
    }
  }
`

'use client'

import { useQuery, useMutation } from '@apollo/client'
import { GET_NOTIFICATIONS } from '@/lib/graphql/queries/notifications'
import { MARK_NOTIFICATION_READ } from '@/lib/graphql/mutations/notifications'
import {
  NotificationsData,
  GetNotificationsVariables,
  MarkNotificationReadData,
  MarkNotificationReadVariables,
} from '../types'

export interface UseNotificationsOptions {
  limit?: number
  offset?: number
  pollInterval?: number
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit = 50, offset = 0, pollInterval = 30000 } = options

  const { data, loading, error, refetch, fetchMore } = useQuery<
    NotificationsData,
    GetNotificationsVariables
  >(GET_NOTIFICATIONS, {
    variables: { limit, offset },
    pollInterval,
    notifyOnNetworkStatusChange: true,
  })

  const [markAsReadMutation, { loading: markingAsRead }] = useMutation<
    MarkNotificationReadData,
    MarkNotificationReadVariables
  >(MARK_NOTIFICATION_READ, {
    refetchQueries: [
      {
        query: GET_NOTIFICATIONS,
        variables: { limit, offset },
      },
    ],
  })

  const notifications = data?.notifications || []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation({
        variables: { notificationId },
        optimisticResponse: {
          markNotificationRead: {
            __typename: 'NotificationEntity',
            id: notificationId,
            title: '',
            message: null,
            type: 'SYSTEM' as any,
            link: null,
            isRead: true,
            readAt: new Date(),
            createdAt: new Date(),
            userId: '',
          },
        },
        update: (cache, { data }) => {
          if (!data?.markNotificationRead) return

          const existingData = cache.readQuery<
            NotificationsData,
            GetNotificationsVariables
          >({
            query: GET_NOTIFICATIONS,
            variables: { limit, offset },
          })

          if (existingData) {
            cache.writeQuery({
              query: GET_NOTIFICATIONS,
              variables: { limit, offset },
              data: {
                notifications: existingData.notifications.map((n) =>
                  n.id === notificationId
                    ? { ...n, isRead: true, readAt: new Date() }
                    : n
                ),
              },
            })
          }
        },
      })
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
      throw err
    }
  }

  const loadMore = () => {
    return fetchMore({
      variables: {
        offset: notifications.length,
        limit,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev
        return {
          notifications: [
            ...prev.notifications,
            ...fetchMoreResult.notifications,
          ],
        }
      },
    })
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markingAsRead,
    refetch,
    loadMore,
  }
}

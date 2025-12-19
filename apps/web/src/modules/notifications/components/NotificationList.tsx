'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/atoms'
import { Spinner } from '@/atoms'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '../types'

export interface NotificationListProps {
  limit?: number
  pollInterval?: number
  onNotificationClick?: (notification: Notification) => void
  className?: string
}

export function NotificationList({
  limit = 20,
  pollInterval = 30000,
  onNotificationClick,
  className,
}: NotificationListProps) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markingAsRead,
    loadMore,
  } = useNotifications({ limit, pollInterval })

  const [loadingMore, setLoadingMore] = React.useState(false)

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      await loadMore()
    } catch (err) {
      console.error('Failed to load more notifications:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading && notifications.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-destructive">
            Failed to load notifications. Please try again.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (notifications.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {unreadCount} unread
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onClick={onNotificationClick}
            />
          ))}

          {notifications.length >= limit && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full"
              >
                {loadingMore ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

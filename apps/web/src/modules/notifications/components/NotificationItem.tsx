'use client'

import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/atoms'
import { NotificationType } from '@mobilizer/shared'
import type { Notification } from '../types'

export interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onClick?: (notification: Notification) => void
}

const notificationTypeConfig: Record<
  NotificationType,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }
> = {
  [NotificationType.POST_LIKE]: { label: 'Like', variant: 'success' },
  [NotificationType.POST_COMMENT]: { label: 'Comment', variant: 'default' },
  [NotificationType.POST_SHARE]: { label: 'Share', variant: 'secondary' },
  [NotificationType.EVENT_INVITATION]: { label: 'Event', variant: 'default' },
  [NotificationType.EVENT_REMINDER]: { label: 'Reminder', variant: 'warning' },
  [NotificationType.MESSAGE]: { label: 'Message', variant: 'default' },
  [NotificationType.MENTION]: { label: 'Mention', variant: 'default' },
  [NotificationType.FOLLOW]: { label: 'Follow', variant: 'success' },
  [NotificationType.ORG_INVITATION]: { label: 'Invitation', variant: 'default' },
  [NotificationType.ORG_APPROVED]: { label: 'Approved', variant: 'success' },
  [NotificationType.ORG_REJECTED]: { label: 'Rejected', variant: 'destructive' },
  [NotificationType.SYSTEM]: { label: 'System', variant: 'secondary' },
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClick,
}: NotificationItemProps) {
  const config = notificationTypeConfig[notification.type as NotificationType]
  const isClickable = !!notification.link || !!onClick

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }

    if (onClick) {
      onClick(notification)
    } else if (notification.link) {
      window.location.href = notification.link
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      className={cn(
        'relative flex flex-col gap-2 rounded-lg border p-4 transition-colors',
        !notification.isRead && 'bg-accent/50',
        isClickable && 'cursor-pointer hover:bg-accent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={notification.title}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
      )}

      <div className={cn('flex items-start gap-3', !notification.isRead && 'pl-3')}>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium leading-none">{notification.title}</p>
            <Badge variant={config.variant} className="text-xs">
              {config.label}
            </Badge>
          </div>

          {notification.message && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>

        {!notification.isRead && onMarkAsRead && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkAsRead(notification.id)
            }}
            className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-2 py-1"
            aria-label="Mark as read"
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  )
}

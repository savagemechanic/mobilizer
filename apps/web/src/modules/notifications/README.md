# Notifications Module

This module handles user notifications display and management.

## Components

### NotificationList

A complete notification list with real-time updates, mark-as-read functionality, and load more support.

```tsx
import { NotificationList } from '@/modules/notifications'

function NotificationsPage() {
  return (
    <NotificationList
      limit={20}
      pollInterval={30000}
      onNotificationClick={(notification) => {
        // Handle notification click
        if (notification.link) {
          router.push(notification.link)
        }
      }}
    />
  )
}
```

**Props:**
- `limit?: number` - Number of notifications to load (default: 20)
- `pollInterval?: number` - Polling interval in ms (default: 30000)
- `onNotificationClick?: (notification: Notification) => void` - Custom click handler
- `className?: string` - Custom class name

### NotificationItem

A single notification item component.

```tsx
import { NotificationItem } from '@/modules/notifications'

function CustomNotification({ notification }) {
  return (
    <NotificationItem
      notification={notification}
      onMarkAsRead={(id) => console.log('Mark as read:', id)}
      onClick={(notification) => console.log('Clicked:', notification)}
    />
  )
}
```

**Props:**
- `notification: Notification` - Notification data
- `onMarkAsRead?: (id: string) => void` - Mark as read handler
- `onClick?: (notification: Notification) => void` - Click handler

## Hooks

### useNotifications

A hook for fetching and managing notifications.

```tsx
import { useNotifications } from '@/modules/notifications'

function NotificationBadge() {
  const { unreadCount, loading } = useNotifications({
    limit: 50,
    pollInterval: 30000,
  })

  if (loading) return <Spinner />

  return (
    <div>
      {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
    </div>
  )
}
```

**Options:**
- `limit?: number` - Number of notifications to fetch (default: 50)
- `offset?: number` - Pagination offset (default: 0)
- `pollInterval?: number` - Polling interval in ms (default: 30000)

**Returns:**
- `notifications: Notification[]` - Array of notifications
- `unreadCount: number` - Number of unread notifications
- `loading: boolean` - Loading state
- `error: ApolloError | undefined` - Error state
- `markAsRead: (id: string) => Promise<void>` - Mark notification as read
- `markingAsRead: boolean` - Mark as read loading state
- `refetch: () => Promise<void>` - Refetch notifications
- `loadMore: () => Promise<void>` - Load more notifications

## Types

```typescript
import type { Notification, NotificationType } from '@/modules/notifications'

const notification: Notification = {
  id: '123',
  title: 'New message',
  message: 'You have a new message',
  type: NotificationType.MESSAGE,
  link: '/messages/123',
  isRead: false,
  readAt: null,
  createdAt: new Date(),
  userId: 'user-123',
}
```

## GraphQL Queries & Mutations

The module uses the following GraphQL operations:

- `GET_NOTIFICATIONS` - Fetch notifications with pagination
- `MARK_NOTIFICATION_READ` - Mark a notification as read

## Notification Types

Supported notification types from `@mobilizer/shared`:

- `POST_LIKE` - Someone liked your post
- `POST_COMMENT` - Someone commented on your post
- `POST_SHARE` - Someone shared your post
- `EVENT_INVITATION` - Event invitation
- `EVENT_REMINDER` - Event reminder
- `MESSAGE` - New message
- `MENTION` - Someone mentioned you
- `FOLLOW` - Someone followed you
- `ORG_INVITATION` - Organization invitation
- `ORG_APPROVED` - Organization membership approved
- `ORG_REJECTED` - Organization membership rejected
- `SYSTEM` - System notification

## Features

- Real-time polling for new notifications
- Optimistic UI updates
- Unread count tracking
- Mark as read functionality
- Load more pagination
- Type badges with color coding
- Keyboard navigation support
- Accessibility features

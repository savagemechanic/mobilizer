'use client'

import { Calendar, MapPin, Users, Eye, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/atoms/Button'
import { Badge } from '@/atoms/Badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import type { EventCardProps, EventStatus } from '../types'

export function EventCard({
  event,
  onClick,
  showActions = false,
  isAdminView = false,
  onEdit,
  onDelete,
}: EventCardProps) {
  const getEventStatus = (): EventStatus => {
    const now = new Date()
    const startTime = new Date(event.startTime)
    const endTime = event.endTime ? new Date(event.endTime) : null

    if (!event.isPublished) {
      return 'DRAFT' as EventStatus
    }

    if (endTime && endTime < now) {
      return 'COMPLETED' as EventStatus
    }

    if (startTime > now) {
      return 'UPCOMING' as EventStatus
    }

    return 'ONGOING' as EventStatus
  }

  const getStatusBadgeVariant = (status: EventStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'secondary'
      case 'UPCOMING':
        return 'default'
      case 'ONGOING':
        return 'warning'
      case 'COMPLETED':
        return 'success'
      default:
        return 'default'
    }
  }

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const status = getEventStatus()
  const eventUrl = isAdminView ? `/admin/events/${event.id}` : `/events/${event.id}`

  const CardWrapper = onClick
    ? ({ children }: { children: React.ReactNode }) => (
        <div onClick={() => onClick(event)} className="cursor-pointer">
          {children}
        </div>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <Link href={eventUrl}>{children}</Link>
      )

  return (
    <CardWrapper>
      <Card className="hover:shadow-lg transition-shadow h-full">
        {event.coverImage && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1">{event.title}</CardTitle>
            <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {event.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {format(new Date(event.startTime), 'PPP')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {event.isVirtual ? 'Virtual Event' : event.location || 'TBD'}
              </span>
            </div>
            {event.attendees && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>{event.attendees.length} attendees</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              {formatEventType(event.type)}
            </span>
            {showActions && isAdminView && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm">
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="flex items-center cursor-pointer"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit?.(event)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete?.(event)
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  )
}

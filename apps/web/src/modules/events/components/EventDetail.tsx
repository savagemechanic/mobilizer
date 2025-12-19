'use client'

import { Calendar, MapPin, Users, ExternalLink, Video } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/atoms/Button'
import { Avatar, AvatarImage, AvatarFallback } from '@/atoms/Avatar'
import { Badge } from '@/atoms/Badge'
import type { EventDetailProps, EventStatus } from '../types'

export function EventDetail({
  event,
  showAttendees = true,
  showActions = true,
  onRegister,
}: EventDetailProps) {
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
  const canRegister = status === 'UPCOMING' || status === 'ONGOING'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
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
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">{event.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
                <Badge variant="outline">{formatEventType(event.type)}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {event.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Date & Time</h3>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">
                      {format(new Date(event.startTime), 'PPPP')}
                    </p>
                    <p className="text-muted-foreground">
                      {format(new Date(event.startTime), 'p')}
                      {event.endTime &&
                        ` - ${format(new Date(event.endTime), 'p')}`}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Location</h3>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    {event.isVirtual ? (
                      <>
                        <p className="font-medium">Virtual Event</p>
                        {event.virtualLink && (
                          <a
                            href={event.virtualLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Join Event
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">
                        {event.location || 'To be determined'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Attendees</h3>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm">
                  {event.attendees?.length || 0} attendee
                  {event.attendees?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {showActions && canRegister && (
            <div className="pt-4 border-t">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={onRegister}
              >
                {event.isVirtual ? (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Register for Event
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Register for Event
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showAttendees && event.attendees && event.attendees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendees ({event.attendees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {event.attendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={attendee.avatar}
                      alt={`${attendee.firstName} ${attendee.lastName}`}
                    />
                    <AvatarFallback>
                      {`${attendee.firstName?.[0]}${attendee.lastName?.[0]}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {attendee.firstName} {attendee.lastName}
                    </p>
                    {attendee.displayName && (
                      <p className="text-sm text-muted-foreground truncate">
                        @{attendee.displayName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {event.organization && (
        <Card>
          <CardHeader>
            <CardTitle>Organized By</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{event.organization.name}</p>
                <p className="text-sm text-muted-foreground">
                  {event.organization.level}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { use } from 'react'
import { useQuery } from '@apollo/client'
import { Calendar, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'
import { GET_EVENT } from '@/lib/graphql/queries/events'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, loading, error } = useQuery(GET_EVENT, {
    variables: { id },
  })

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !data?.event) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
        <p className="text-red-600">Failed to load event</p>
      </div>
    )
  }

  const event = data.event

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{event.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg">{event.description}</p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(new Date(event.startDate), 'PPP')} at {format(new Date(event.startDate), 'p')}
                </p>
                <p className="text-sm text-muted-foreground">
                  to {format(new Date(event.endDate), 'PPP')} at {format(new Date(event.endDate), 'p')}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <p>{event.location}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <p>{event.attendees.length} attendees</p>
            </div>
          </div>

          <div className="pt-4">
            <Button size="lg" className="w-full sm:w-auto">
              Register for Event
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {event.attendees.map((attendee: any) => (
              <div key={attendee.id} className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={attendee.avatar} />
                  <AvatarFallback>
                    {`${attendee.firstName?.[0]}${attendee.lastName?.[0]}`.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {attendee.firstName} {attendee.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">@{attendee.displayName}</p>
                </div>
              </div>
            ))}
          </div>
          {event.attendees.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No attendees yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

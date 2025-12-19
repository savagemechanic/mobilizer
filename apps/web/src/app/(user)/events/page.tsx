'use client'

import { useQuery } from '@apollo/client'
import Link from 'next/link'
import { Calendar, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'
import { GET_EVENTS } from '@/lib/graphql/queries/events'
import type { Event } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'

export default function EventsPage() {
  const { data, loading, error } = useQuery(GET_EVENTS, {
    variables: { limit: 20, offset: 0 },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events</h1>
        <Button>Create Event</Button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-red-600">Failed to load events</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {data?.events?.events.map((event: Event) => (
          <Link key={event.id} href={`/events/${event.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(event.startDate), 'PPP')}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{event.attendees.length} attendees</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {data?.events?.events.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          No events yet. Create one to get started!
        </div>
      )}
    </div>
  )
}

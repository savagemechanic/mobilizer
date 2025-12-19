'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import Link from 'next/link'
import { Calendar, MapPin, Users, Eye, Edit, Trash2, Search, Filter } from 'lucide-react'
import { GET_EVENTS } from '@/lib/graphql/queries/events'
import { GET_SUPPORT_GROUPS } from '@/lib/graphql/queries/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { ConfirmDialog } from '@/modals'

interface Event {
  id: string
  title: string
  description: string
  type: string
  startTime: string
  endTime?: string
  location?: string
  isVirtual: boolean
  virtualLink?: string
  coverImage?: string
  isPublished: boolean
  creatorId: string
  orgId?: string
  createdAt: string
  updatedAt?: string
}

interface Organization {
  id: string
  name: string
  level: string
}

export default function AdminEventsPage() {
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState<string>('all')
  const pageSize = 20

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    eventId: string | null
    eventTitle: string | null
  }>({
    open: false,
    eventId: null,
    eventTitle: null,
  })

  // Query events
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch } = useQuery(GET_EVENTS, {
    variables: {
      limit: pageSize,
      offset: page * pageSize,
      orgId: selectedOrg === 'all' ? undefined : selectedOrg,
    },
  })

  // Query organizations for filter
  const { data: orgsData } = useQuery(GET_SUPPORT_GROUPS, {
    variables: {
      movementId: typeof window !== 'undefined' ? localStorage.getItem('currentMovementId') : null,
      limit: 100,
      offset: 0,
    },
    skip: typeof window === 'undefined',
  })

  const events: Event[] = eventsData?.events || []
  const organizations: Organization[] = orgsData?.organizations || []

  // Client-side filtering
  const filteredEvents = events.filter((event) => {
    // Search filter
    if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Type filter
    if (selectedType !== 'all' && event.type !== selectedType) {
      return false
    }

    // Time filter
    if (timeFilter === 'upcoming') {
      return new Date(event.startTime) >= new Date()
    } else if (timeFilter === 'past') {
      return new Date(event.startTime) < new Date()
    }

    return true
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getStatusBadge = (event: Event) => {
    const now = new Date()
    const startTime = new Date(event.startTime)
    const endTime = event.endTime ? new Date(event.endTime) : null

    if (!event.isPublished) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Draft</span>
    }

    if (endTime && endTime < now) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Completed</span>
    }

    if (startTime > now) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Upcoming</span>
    }

    return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Ongoing</span>
  }

  const handleDeleteClick = (eventId: string, eventTitle: string) => {
    setConfirmDialog({
      open: true,
      eventId,
      eventTitle,
    })
  }

  const handleConfirmDelete = () => {
    if (confirmDialog.eventId) {
      // TODO: Implement delete mutation
      console.log('Delete event:', confirmDialog.eventId)
      setConfirmDialog({ open: false, eventId: null, eventTitle: null })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events Management</h1>
        <Link href="/admin/events/create">
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>All Events</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Time filter */}
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>

              {/* Type filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="RALLY">Rally</SelectItem>
                  <SelectItem value="TOWN_HALL">Town Hall</SelectItem>
                  <SelectItem value="WEBINAR">Webinar</SelectItem>
                  <SelectItem value="WORKSHOP">Workshop</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Organization filter */}
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : eventsError ? (
            <div className="text-center py-12">
              <p className="text-red-500">Error loading events: {eventsError.message}</p>
              <Button onClick={() => refetch()} className="mt-4" variant="outline">
                Retry
              </Button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No events found</p>
              {(searchTerm || selectedType !== 'all' || selectedOrg !== 'all' || timeFilter !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedType('all')
                    setSelectedOrg('all')
                    setTimeFilter('all')
                  }}
                  variant="link"
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Event</th>
                      <th className="text-left p-3 font-semibold">Date & Time</th>
                      <th className="text-left p-3 font-semibold">Location</th>
                      <th className="text-left p-3 font-semibold">Type</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-right p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-start gap-3">
                            {event.coverImage ? (
                              <img
                                src={event.coverImage}
                                alt={event.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{event.title}</p>
                              {event.description && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="whitespace-nowrap">{formatDate(event.startTime)}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">
                              {event.isVirtual ? 'Virtual' : event.location || 'TBD'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{formatEventType(event.type)}</span>
                        </td>
                        <td className="p-3">{getStatusBadge(event)}</td>
                        <td className="p-3">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
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
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/admin/events/${event.id}/edit`}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(event.id, event.title)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {events.length >= pageSize && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, page * pageSize + events.length)} events
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={events.length < pageSize}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ open, eventId: null, eventTitle: null })
        }
        title="Delete Event"
        description={`Are you sure you want to delete "${confirmDialog.eventTitle}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

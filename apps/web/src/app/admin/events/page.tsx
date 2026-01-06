'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import Link from 'next/link'
import { Calendar, MapPin, Users, Eye, Edit, Trash2, Search, Filter, X } from 'lucide-react'
import { GET_EVENTS } from '@/lib/graphql/queries/events'
import { DELETE_EVENT } from '@/lib/graphql/mutations/events'
import { GET_SUPPORT_GROUPS } from '@/lib/graphql/queries/admin'
import {
  GET_COUNTRIES,
  GET_STATES,
  GET_LGAS,
  GET_WARDS,
  GET_POLLING_UNITS
} from '@/lib/graphql/queries/locations'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Badge } from '@/ui/badge'
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
import { EventType } from '@mobilizer/shared'
import { useToast } from '@/hooks/use-toast'

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
  creator?: {
    id: string
    firstName: string
    lastName: string
    displayName?: string
    avatar?: string
  }
  organization?: {
    id: string
    name: string
    logo?: string
  }
}

interface Organization {
  id: string
  name: string
  level: string
}

interface Location {
  id: string
  name: string
  code?: string
}

export default function AdminEventsPage() {
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState<string>('all')
  const pageSize = 20

  // Location filters
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedLGA, setSelectedLGA] = useState<string>('')
  const [selectedWard, setSelectedWard] = useState<string>('')
  const [selectedPollingUnit, setSelectedPollingUnit] = useState<string>('')

  // Date range filters
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Query events
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch } = useQuery(GET_EVENTS, {
    variables: {
      limit: pageSize,
      offset: page * pageSize,
      orgId: selectedOrg === 'all' ? undefined : selectedOrg,
    },
    fetchPolicy: 'cache-and-network',
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

  // Location queries
  const { data: countriesData } = useQuery(GET_COUNTRIES)
  const { data: statesData } = useQuery(GET_STATES, {
    variables: { countryId: selectedCountry || undefined },
    skip: !selectedCountry,
  })
  const { data: lgasData } = useQuery(GET_LGAS, {
    variables: { stateId: selectedState || undefined },
    skip: !selectedState,
  })
  const { data: wardsData } = useQuery(GET_WARDS, {
    variables: { lgaId: selectedLGA || undefined },
    skip: !selectedLGA,
  })
  const { data: pollingUnitsData } = useQuery(GET_POLLING_UNITS, {
    variables: { wardId: selectedWard || undefined },
    skip: !selectedWard,
  })

  // Delete mutation
  const [deleteEventMutation, { loading: deleteLoading }] = useMutation(DELETE_EVENT, {
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete event',
        variant: 'destructive',
      })
    },
  })

  const events: Event[] = eventsData?.events || []
  const organizations: Organization[] = orgsData?.organizations || []
  const countries: Location[] = countriesData?.countries || []
  const states: Location[] = statesData?.states || []
  const lgas: Location[] = lgasData?.lgas || []
  const wards: Location[] = wardsData?.wards || []
  const pollingUnits: Location[] = pollingUnitsData?.pollingUnits || []

  // Reset dependent location filters
  useEffect(() => {
    setSelectedState('')
    setSelectedLGA('')
    setSelectedWard('')
    setSelectedPollingUnit('')
  }, [selectedCountry])

  useEffect(() => {
    setSelectedLGA('')
    setSelectedWard('')
    setSelectedPollingUnit('')
  }, [selectedState])

  useEffect(() => {
    setSelectedWard('')
    setSelectedPollingUnit('')
  }, [selectedLGA])

  useEffect(() => {
    setSelectedPollingUnit('')
  }, [selectedWard])

  // Client-side filtering
  const filteredEvents = events.filter((event) => {
    // Search filter
    if (debouncedSearch && !event.title.toLowerCase().includes(debouncedSearch.toLowerCase())) {
      return false
    }

    // Type filter
    if (selectedType !== 'all' && event.type !== selectedType) {
      return false
    }

    // Time filter
    const eventDate = new Date(event.startTime)
    const now = new Date()

    if (timeFilter === 'upcoming') {
      if (eventDate < now) return false
    } else if (timeFilter === 'past') {
      if (eventDate >= now) return false
    }

    // Date range filter
    if (startDate && eventDate < new Date(startDate)) {
      return false
    }
    if (endDate && eventDate > new Date(endDate)) {
      return false
    }

    return true
  })

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedType !== 'all' ||
    selectedOrg !== 'all' ||
    timeFilter !== 'all' ||
    selectedCountry !== '' ||
    selectedState !== '' ||
    selectedLGA !== '' ||
    selectedWard !== '' ||
    selectedPollingUnit !== '' ||
    startDate !== '' ||
    endDate !== ''

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedType('all')
    setSelectedOrg('all')
    setTimeFilter('all')
    setSelectedCountry('')
    setSelectedState('')
    setSelectedLGA('')
    setSelectedWard('')
    setSelectedPollingUnit('')
    setStartDate('')
    setEndDate('')
    setPage(0)
  }

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

  const handleConfirmDelete = async () => {
    if (confirmDialog.eventId) {
      try {
        await deleteEventMutation({
          variables: { id: confirmDialog.eventId },
        })
        setConfirmDialog({ open: false, eventId: null, eventTitle: null })
      } catch (error) {
        // Error handled by mutation onError
        console.error('Delete error:', error)
      }
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
            <div className="space-y-4">
              {/* Row 1: Search and Quick Filters */}
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

              {/* Row 2: Location Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location:
                </div>

                {/* Country */}
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Countries</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* State */}
                {selectedCountry && (
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All States</SelectItem>
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* LGA */}
                {selectedState && (
                  <Select value={selectedLGA} onValueChange={setSelectedLGA}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All LGAs</SelectItem>
                      {lgas.map((lga) => (
                        <SelectItem key={lga.id} value={lga.id}>
                          {lga.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Ward */}
                {selectedLGA && (
                  <Select value={selectedWard} onValueChange={setSelectedWard}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Ward" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Wards</SelectItem>
                      {wards.map((ward) => (
                        <SelectItem key={ward.id} value={ward.id}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Polling Unit */}
                {selectedWard && (
                  <Select value={selectedPollingUnit} onValueChange={setSelectedPollingUnit}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Polling Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Polling Units</SelectItem>
                      {pollingUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Row 3: Date Range Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range:
                </div>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[160px]"
                  placeholder="Start date"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[160px]"
                  placeholder="End date"
                />
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="ml-auto"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear all filters
                  </Button>
                )}
              </div>
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
              {hasActiveFilters && (
                <Button
                  onClick={clearAllFilters}
                  variant="link"
                  className="mt-2"
                >
                  Clear all filters
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

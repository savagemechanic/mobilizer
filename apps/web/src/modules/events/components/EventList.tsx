'use client'

import { useState } from 'react'
import { Calendar, Filter } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@apollo/client'
import { GET_EVENTS } from '@/lib/graphql/queries/events'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/atoms/Button'
import { Spinner } from '@/atoms/Spinner'
import { SearchInput } from '@/molecules/SearchInput'
import { FilterSelect } from '@/molecules/FilterSelect'
import { Pagination } from '@/organisms/Pagination'
import { EventCard } from './EventCard'
import type { Event, EventFilters, EventListProps, EventType } from '../types'

export function EventList({
  showFilters = true,
  showCreateButton = true,
  showPagination = true,
  isAdminView = false,
  onEventClick,
}: EventListProps) {
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<EventFilters>({
    searchTerm: '',
    type: 'all',
    timeFilter: 'all',
    orgId: undefined,
  })
  const pageSize = 20

  const { data, loading, error, refetch } = useQuery(GET_EVENTS, {
    variables: {
      limit: pageSize,
      offset: page * pageSize,
      orgId: filters.orgId,
    },
  })

  const events: Event[] = data?.events || []

  // Client-side filtering
  const filteredEvents = events.filter((event) => {
    // Search filter
    if (
      filters.searchTerm &&
      !event.title.toLowerCase().includes(filters.searchTerm.toLowerCase())
    ) {
      return false
    }

    // Type filter
    if (filters.type !== 'all' && event.type !== filters.type) {
      return false
    }

    // Time filter
    if (filters.timeFilter === 'upcoming') {
      return new Date(event.startTime) >= new Date()
    } else if (filters.timeFilter === 'past') {
      return new Date(event.startTime) < new Date()
    }

    return true
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
  }

  const handleTypeChange = (value: string) => {
    setFilters((prev) => ({ ...prev, type: value as EventType | 'all' }))
  }

  const handleTimeFilterChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      timeFilter: value as 'all' | 'upcoming' | 'past',
    }))
  }

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      type: 'all',
      timeFilter: 'all',
      orgId: undefined,
    })
  }

  const hasActiveFilters =
    filters.searchTerm || filters.type !== 'all' || filters.timeFilter !== 'all'

  const handleDelete = (event: Event) => {
    if (confirm('Are you sure you want to delete this event?')) {
      // TODO: Implement delete mutation
      console.log('Delete event:', event.id)
    }
  }

  const handleEdit = (event: Event) => {
    // Navigate to edit page
    window.location.href = isAdminView
      ? `/admin/events/${event.id}/edit`
      : `/events/${event.id}/edit`
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error loading events: {error.message}</p>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {isAdminView ? 'Events Management' : 'Events'}
        </h1>
        {showCreateButton && (
          <Link href={isAdminView ? '/admin/events/create' : '/events/create'}>
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <SearchInput
                  value={filters.searchTerm || ''}
                  onChange={handleSearchChange}
                  placeholder="Search events..."
                />
              </div>

              <FilterSelect
                value={filters.timeFilter || 'all'}
                onValueChange={handleTimeFilterChange}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'past', label: 'Past' },
                ]}
                placeholder="Time"
                className="w-[150px]"
              />

              <FilterSelect
                value={filters.type || 'all'}
                onValueChange={handleTypeChange}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'MEETING', label: 'Meeting' },
                  { value: 'RALLY', label: 'Rally' },
                  { value: 'TOWN_HALL', label: 'Town Hall' },
                  { value: 'WEBINAR', label: 'Webinar' },
                  { value: 'WORKSHOP', label: 'Workshop' },
                  { value: 'OTHER', label: 'Other' },
                ]}
                placeholder="Type"
                className="w-[150px]"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2">No events found</p>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="link">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={onEventClick}
                showActions={isAdminView}
                isAdminView={isAdminView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {showPagination && events.length >= pageSize && (
            <Pagination
              currentPage={page}
              totalItems={page * pageSize + events.length}
              itemsPerPage={pageSize}
              onPageChange={setPage}
              showItemRange={true}
            />
          )}
        </>
      )}
    </div>
  )
}

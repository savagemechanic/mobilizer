'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_EVENTS, GET_EVENT } from '@/lib/graphql/queries/events'
import {
  CREATE_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
  REGISTER_FOR_EVENT,
} from '@/lib/graphql/mutations/events'
import type { Event, EventFilters, EventFormData } from '../types'

interface UseEventsOptions {
  limit?: number
  offset?: number
  orgId?: string
  filters?: EventFilters
}

interface UseEventsResult {
  events: Event[]
  loading: boolean
  error: Error | undefined
  refetch: () => void
  hasMore: boolean
  loadMore: () => void
  totalCount: number
}

export function useEvents(options: UseEventsOptions = {}): UseEventsResult {
  const {
    limit = 20,
    offset = 0,
    orgId,
    filters = {},
  } = options

  const [page, setPage] = useState(0)
  const pageSize = limit

  const { data, loading, error, refetch } = useQuery(GET_EVENTS, {
    variables: {
      limit: pageSize,
      offset: page * pageSize + offset,
      orgId: orgId || filters.orgId,
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
    if (filters.type && filters.type !== 'all' && event.type !== filters.type) {
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

  const loadMore = () => {
    setPage((prev) => prev + 1)
  }

  return {
    events: filteredEvents,
    loading,
    error,
    refetch,
    hasMore: events.length >= pageSize,
    loadMore,
    totalCount: filteredEvents.length,
  }
}

interface UseEventOptions {
  id: string
  skip?: boolean
}

interface UseEventResult {
  event: Event | null
  loading: boolean
  error: Error | undefined
  refetch: () => void
}

export function useEvent(options: UseEventOptions): UseEventResult {
  const { id, skip = false } = options

  const { data, loading, error, refetch } = useQuery(GET_EVENT, {
    variables: { id },
    skip: skip || !id,
  })

  return {
    event: data?.event || null,
    loading,
    error,
    refetch,
  }
}

interface UseCreateEventOptions {
  onSuccess?: (event: Event) => void
  onError?: (error: Error) => void
}

interface UseCreateEventResult {
  createEvent: (data: EventFormData) => Promise<void>
  loading: boolean
  error: Error | undefined
}

export function useCreateEvent(
  options: UseCreateEventOptions = {}
): UseCreateEventResult {
  const { onSuccess, onError } = options

  const [createEventMutation, { loading, error }] = useMutation(
    CREATE_EVENT,
    {
      onCompleted: (data) => {
        if (data?.createEvent) {
          onSuccess?.(data.createEvent)
        }
      },
      onError: (err) => {
        onError?.(err)
      },
      refetchQueries: [{ query: GET_EVENTS }],
    }
  )

  const createEvent = async (data: EventFormData) => {
    try {
      await createEventMutation({
        variables: { input: data },
      })
    } catch (err) {
      console.error('Failed to create event:', err)
    }
  }

  return {
    createEvent,
    loading,
    error,
  }
}

interface UseUpdateEventOptions {
  onSuccess?: (event: Event) => void
  onError?: (error: Error) => void
}

interface UseUpdateEventResult {
  updateEvent: (id: string, data: EventFormData) => Promise<void>
  loading: boolean
  error: Error | undefined
}

export function useUpdateEvent(
  options: UseUpdateEventOptions = {}
): UseUpdateEventResult {
  const { onSuccess, onError } = options

  const [updateEventMutation, { loading, error }] = useMutation(
    UPDATE_EVENT,
    {
      onCompleted: (data) => {
        if (data?.updateEvent) {
          onSuccess?.(data.updateEvent)
        }
      },
      onError: (err) => {
        onError?.(err)
      },
      refetchQueries: [{ query: GET_EVENTS }],
    }
  )

  const updateEvent = async (id: string, data: EventFormData) => {
    try {
      await updateEventMutation({
        variables: { id, input: data },
      })
    } catch (err) {
      console.error('Failed to update event:', err)
    }
  }

  return {
    updateEvent,
    loading,
    error,
  }
}

interface UseDeleteEventOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

interface UseDeleteEventResult {
  deleteEvent: (id: string) => Promise<void>
  loading: boolean
  error: Error | undefined
}

export function useDeleteEvent(
  options: UseDeleteEventOptions = {}
): UseDeleteEventResult {
  const { onSuccess, onError } = options

  const [deleteEventMutation, { loading, error }] = useMutation(
    DELETE_EVENT,
    {
      onCompleted: () => {
        onSuccess?.()
      },
      onError: (err) => {
        onError?.(err)
      },
      refetchQueries: [{ query: GET_EVENTS }],
    }
  )

  const deleteEvent = async (id: string) => {
    try {
      await deleteEventMutation({
        variables: { id },
      })
    } catch (err) {
      console.error('Failed to delete event:', err)
    }
  }

  return {
    deleteEvent,
    loading,
    error,
  }
}

interface UseRegisterEventOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

interface UseRegisterEventResult {
  registerForEvent: (eventId: string) => Promise<void>
  loading: boolean
  error: Error | undefined
}

export function useRegisterEvent(
  options: UseRegisterEventOptions = {}
): UseRegisterEventResult {
  const { onSuccess, onError } = options

  const [registerMutation, { loading, error }] = useMutation(
    REGISTER_FOR_EVENT,
    {
      onCompleted: () => {
        onSuccess?.()
      },
      onError: (err) => {
        onError?.(err)
      },
      refetchQueries: [{ query: GET_EVENTS }],
    }
  )

  const registerForEvent = async (eventId: string) => {
    try {
      await registerMutation({
        variables: { eventId },
      })
    } catch (err) {
      console.error('Failed to register for event:', err)
    }
  }

  return {
    registerForEvent,
    loading,
    error,
  }
}

// Events Types

export interface Event {
  id: string
  title: string
  description: string
  type: EventType
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
  attendees?: EventAttendee[]
  organization?: EventOrganization
  creator?: EventCreator
}

export interface EventAttendee {
  id: string
  firstName: string
  lastName: string
  displayName?: string
  avatar?: string
}

export interface EventOrganization {
  id: string
  name: string
  level: string
}

export interface EventCreator {
  id: string
  firstName: string
  lastName: string
  displayName?: string
  avatar?: string
}

export enum EventType {
  MEETING = 'MEETING',
  RALLY = 'RALLY',
  TOWN_HALL = 'TOWN_HALL',
  WEBINAR = 'WEBINAR',
  WORKSHOP = 'WORKSHOP',
  OTHER = 'OTHER',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
}

export interface EventFormData {
  title: string
  description: string
  type: EventType
  startTime: string
  endTime?: string
  location?: string
  isVirtual: boolean
  virtualLink?: string
  coverImage?: string
  isPublished: boolean
  orgId?: string
}

export interface EventFilters {
  searchTerm?: string
  type?: EventType | 'all'
  timeFilter?: 'all' | 'upcoming' | 'past'
  orgId?: string
}

export interface EventListProps {
  showFilters?: boolean
  showCreateButton?: boolean
  showPagination?: boolean
  isAdminView?: boolean
  onEventClick?: (event: Event) => void
}

export interface EventCardProps {
  event: Event
  onClick?: (event: Event) => void
  showActions?: boolean
  isAdminView?: boolean
  onEdit?: (event: Event) => void
  onDelete?: (event: Event) => void
}

export interface EventDetailProps {
  event: Event
  showAttendees?: boolean
  showActions?: boolean
  onRegister?: () => void
}

export interface EventFormProps {
  event?: Event
  onSubmit: (data: EventFormData) => void
  onCancel?: () => void
  isLoading?: boolean
}

import { gql } from '@apollo/client'

export const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      title
      description
      type
      startTime
      endTime
      location
      isVirtual
      virtualLink
      coverImage
      isPublished
      creatorId
      orgId
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: String!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      title
      description
      type
      startTime
      endTime
      location
      isVirtual
      virtualLink
      coverImage
      isPublished
      creatorId
      orgId
      createdAt
      updatedAt
    }
  }
`

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: String!) {
    deleteEvent(id: $id)
  }
`

export const REGISTER_FOR_EVENT = gql`
  mutation RegisterForEvent($eventId: String!) {
    registerForEvent(eventId: $eventId) {
      id
      eventId
      userId
      registeredAt
    }
  }
`

export const UNREGISTER_FROM_EVENT = gql`
  mutation UnregisterFromEvent($eventId: String!) {
    unregisterFromEvent(eventId: $eventId)
  }
`

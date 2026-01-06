import { gql } from '@apollo/client'

export const GET_EVENTS = gql`
  query GetEvents($limit: Float, $offset: Float, $orgId: String) {
    events(limit: $limit, offset: $offset, orgId: $orgId) {
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
      creator {
        id
        firstName
        lastName
        displayName
        avatar
      }
      organization {
        id
        name
        logo
      }
    }
  }
`

export const GET_EVENT = gql`
  query GetEvent($id: String!) {
    event(id: $id) {
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

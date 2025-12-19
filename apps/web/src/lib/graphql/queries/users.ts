import { gql } from '@apollo/client'

export const GET_USER = gql`
  query GetUser($id: String!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      middleName
      displayName
      avatar
      bio
      phoneNumber
      isActive
      isEmailVerified
      isSuspended
      suspendedReason
      suspendedAt
      isPlatformAdmin
      createdAt
    }
  }
`

export const GET_USER_MEMBERSHIPS = gql`
  query GetUserMemberships($userId: String!) {
    userMemberships(userId: $userId) {
      id
      userId
      orgId
      isAdmin
      isActive
      joinedAt
      approvedAt
      organization {
        id
        name
        slug
        logo
        level
      }
      user {
        id
        firstName
        lastName
        displayName
        email
        avatar
      }
    }
  }
`

export const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $limit: Float, $offset: Float) {
    searchUsers(query: $query, limit: $limit, offset: $offset) {
      id
      email
      firstName
      lastName
      middleName
      displayName
      avatar
      phoneNumber
      bio
      isActive
      isEmailVerified
      isPlatformAdmin
      isSuspended
      createdAt
    }
  }
`

import { gql } from '@apollo/client'

export const GET_PLATFORM_STATS = gql`
  query GetPlatformStats {
    platformStats {
      totalMovements
      totalSupportGroups
      totalUsers
      totalPosts
      totalEvents
      activeUsersToday
      newUsersThisWeek
      movementSummaries {
        id
        name
        supportGroupsCount
        membersCount
      }
    }
  }
`

export const GET_MOVEMENTS = gql`
  query GetMovements($filter: MovementFilterInput, $limit: Int, $offset: Int) {
    movements(filter: $filter, limit: $limit, offset: $offset) {
      id
      name
      slug
      description
      logo
      isActive
      createdAt
      superAdmins {
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

export const GET_MOVEMENT = gql`
  query GetMovement($id: String!) {
    movement(id: $id) {
      id
      name
      slug
      description
      logo
      banner
      website
      isActive
      supportGroupsCount
      membersCount
      createdById
      superAdmins {
        id
        firstName
        lastName
        displayName
        email
        avatar
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_PLATFORM_ADMINS = gql`
  query GetPlatformAdmins {
    platformAdmins {
      id
      firstName
      lastName
      middleName
      displayName
      email
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

export const GET_ALL_USERS = gql`
  query GetAllUsers($filter: UserFilterInput, $pagination: UserPaginationInput) {
    allUsers(filter: $filter, pagination: $pagination) {
      items {
        id
        firstName
        lastName
        middleName
        displayName
        email
        avatar
        phoneNumber
        bio
        isPlatformAdmin
        isActive
        isEmailVerified
        isSuspended
        suspendedReason
        suspendedAt
        createdAt
      }
      totalCount
      hasMore
    }
  }
`

export const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $limit: Int, $offset: Int) {
    searchUsers(query: $query, limit: $limit, offset: $offset) {
      id
      firstName
      lastName
      middleName
      displayName
      email
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

export const GET_PLATFORM_SETTINGS = gql`
  query GetPlatformSettings {
    platformSettings {
      id
      publicOrgEnabled
      publicOrgId
      createdAt
      updatedAt
    }
  }
`

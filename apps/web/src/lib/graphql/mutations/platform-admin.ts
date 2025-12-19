import { gql } from '@apollo/client'

export const CREATE_MOVEMENT = gql`
  mutation CreateMovement($input: CreateMovementInput!) {
    createMovement(input: $input) {
      id
      name
      slug
    }
  }
`

export const UPDATE_MOVEMENT = gql`
  mutation UpdateMovement($id: String!, $input: UpdateMovementInput!) {
    updateMovement(id: $id, input: $input) {
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
      createdAt
      updatedAt
    }
  }
`

export const DELETE_MOVEMENT = gql`
  mutation DeleteMovement($id: String!) {
    deleteMovement(id: $id)
  }
`

export const ASSIGN_SUPER_ADMIN = gql`
  mutation AssignSuperAdmin($movementId: String!, $userId: String!) {
    assignSuperAdmin(movementId: $movementId, userId: $userId) {
      id
      userId
      movementId
      assignedAt
      assignedBy
      user {
        id
        firstName
        lastName
        displayName
        email
        avatar
      }
      movement {
        id
        name
        slug
      }
    }
  }
`

export const REVOKE_SUPER_ADMIN = gql`
  mutation RevokeSuperAdmin($movementId: String!, $userId: String!) {
    revokeSuperAdmin(movementId: $movementId, userId: $userId)
  }
`

export const GRANT_PLATFORM_ADMIN = gql`
  mutation GrantPlatformAdmin($userId: String!) {
    grantPlatformAdmin(userId: $userId) {
      id
      email
      firstName
      lastName
      middleName
      displayName
      avatar
      isPlatformAdmin
      isActive
      isEmailVerified
      isSuspended
      createdAt
    }
  }
`

export const REVOKE_PLATFORM_ADMIN = gql`
  mutation RevokePlatformAdmin($userId: String!) {
    revokePlatformAdmin(userId: $userId) {
      id
      email
      firstName
      lastName
      middleName
      displayName
      avatar
      isPlatformAdmin
      isActive
      isEmailVerified
      isSuspended
      createdAt
    }
  }
`

export const SUSPEND_USER = gql`
  mutation SuspendUser($userId: String!, $reason: String!) {
    suspendUser(userId: $userId, reason: $reason) {
      id
      email
      firstName
      lastName
      displayName
      isSuspended
      suspendedReason
      suspendedAt
      isActive
      isPlatformAdmin
      isEmailVerified
      createdAt
    }
  }
`

export const UNSUSPEND_USER = gql`
  mutation UnsuspendUser($userId: String!) {
    unsuspendUser(userId: $userId) {
      id
      email
      firstName
      lastName
      displayName
      isSuspended
      suspendedReason
      suspendedAt
      isActive
      isPlatformAdmin
      isEmailVerified
      createdAt
    }
  }
`

export const CREATE_PLATFORM_ADMIN_USER = gql`
  mutation CreatePlatformAdminUser($input: CreatePlatformAdminUserInput!) {
    createPlatformAdminUser(input: $input) {
      id
      email
      firstName
      lastName
      middleName
      displayName
      phoneNumber
      avatar
      isPlatformAdmin
      isActive
      isEmailVerified
      isSuspended
      createdAt
    }
  }
`

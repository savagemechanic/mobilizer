import { gql } from '@apollo/client'

export const ME = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
      displayName
      avatar
      bio
      phoneNumber
      isEmailVerified
      isActive
      isPlatformAdmin
      createdAt
    }
  }
`

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      user {
        id
        email
        firstName
        lastName
        displayName
        avatar
        bio
        isEmailVerified
        isActive
        isPlatformAdmin
        createdAt
      }
    }
  }
`

export const GET_USER_ROLES = gql`
  query GetUserRoles($movementId: ID) {
    getUserRoles(movementId: $movementId) {
      movement_id
      movement_name
      roles {
        role_id
        role_name
        support_groups {
          id
          name
        }
      }
    }
  }
`

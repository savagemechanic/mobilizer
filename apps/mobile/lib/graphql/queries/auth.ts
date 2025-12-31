import { gql } from '@apollo/client';

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
      location {
        country {
          id
          name
        }
        state {
          id
          name
        }
        lga {
          id
          name
        }
        ward {
          id
          name
        }
        pollingUnit {
          id
          name
        }
      }
    }
  }
`;

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
`;

import { gql } from '@apollo/client';

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
      isEmailVerified
      isActive
      isPlatformAdmin
      createdAt
      postCount
      followerCount
      followingCount
      isFollowing
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

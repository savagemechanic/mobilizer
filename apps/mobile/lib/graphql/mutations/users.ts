import { gql } from '@apollo/client';

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
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

export const FOLLOW_USER = gql`
  mutation FollowUser($userId: String!) {
    followUser(userId: $userId)
  }
`;

export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: String!) {
    unfollowUser(userId: $userId)
  }
`;

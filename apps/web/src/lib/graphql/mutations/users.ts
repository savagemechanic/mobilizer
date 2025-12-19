import { gql } from '@apollo/client'

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
      address
      dateOfBirth
      gender
      countryId
      stateId
      lgaId
      wardId
      pollingUnitId
      isActive
      isEmailVerified
      isPlatformAdmin
      createdAt
    }
  }
`

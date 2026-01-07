import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
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
          geopoliticalZone {
            id
            name
          }
          state {
            id
            name
            code
          }
          senatorialZone {
            id
            name
          }
          federalConstituency {
            id
            name
          }
          lga {
            id
            name
            code
          }
          ward {
            id
            name
            code
          }
          pollingUnit {
            id
            name
            code
          }
        }
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
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
          geopoliticalZone {
            id
            name
          }
          state {
            id
            name
            code
          }
          senatorialZone {
            id
            name
          }
          federalConstituency {
            id
            name
          }
          lga {
            id
            name
            code
          }
          ward {
            id
            name
            code
          }
          pollingUnit {
            id
            name
            code
          }
        }
      }
    }
  }
`;

export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;

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
          geopoliticalZone {
            id
            name
          }
          state {
            id
            name
            code
          }
          senatorialZone {
            id
            name
          }
          federalConstituency {
            id
            name
          }
          lga {
            id
            name
            code
          }
          ward {
            id
            name
            code
          }
          pollingUnit {
            id
            name
            code
          }
        }
      }
    }
  }
`;

export const GOOGLE_LOGIN = gql`
  mutation GoogleLogin($input: GoogleLoginInput!) {
    googleLogin(input: $input) {
      accessToken
      refreshToken
      user {
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
          geopoliticalZone {
            id
            name
          }
          state {
            id
            name
            code
          }
          senatorialZone {
            id
            name
          }
          federalConstituency {
            id
            name
          }
          lga {
            id
            name
            code
          }
          ward {
            id
            name
            code
          }
          pollingUnit {
            id
            name
            code
          }
        }
      }
    }
  }
`;

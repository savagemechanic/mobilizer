import { gql } from '@apollo/client'

export const GET_ORG_WALLET = gql`
  query GetOrgWallet($orgId: String!) {
    orgWallet(orgId: $orgId) {
      id
      orgId
      balance
      ledgerBalance
      status
      createdAt
      updatedAt
      organization {
        id
        name
        logo
      }
    }
  }
`

export const GET_WALLET_WITH_TRANSACTIONS = gql`
  query GetWalletWithTransactions($orgId: String!, $limit: Float) {
    orgWalletWithTransactions(orgId: $orgId, limit: $limit) {
      id
      orgId
      balance
      ledgerBalance
      status
      createdAt
      updatedAt
      organization {
        id
        name
        logo
      }
      transactions {
        id
        walletId
        type
        amount
        balanceBefore
        balanceAfter
        status
        reference
        description
        recipientUserId
        recipient {
          id
          firstName
          lastName
          displayName
          avatar
          phoneNumber
        }
        createdAt
        updatedAt
      }
    }
  }
`

export const GET_WALLET_STATS = gql`
  query GetWalletStats($orgId: String!) {
    walletStats(orgId: $orgId) {
      totalFunded
      totalDisbursed
      currentBalance
      transactionCount
      disbursementCount
    }
  }
`

export const GET_ELIGIBLE_MEMBERS = gql`
  query GetEligibleDisbursementMembers($orgId: String!, $filter: DisbursementFilterInput) {
    eligibleDisbursementMembers(orgId: $orgId, filter: $filter) {
      id
      firstName
      lastName
      displayName
      avatar
      phoneNumber
      membershipId
      isVerified
      isLeader
      isChairman
      stateName
      lgaName
      wardName
    }
  }
`

export const GET_WALLET_TRANSACTIONS = gql`
  query GetWalletTransactions($filter: TransactionFilterInput!) {
    walletTransactions(filter: $filter) {
      transactions {
        id
        walletId
        type
        amount
        balanceBefore
        balanceAfter
        status
        reference
        description
        recipientUserId
        recipient {
          id
          firstName
          lastName
          displayName
          avatar
        }
        createdAt
        updatedAt
      }
      total
      page
      limit
      totalPages
    }
  }
`

export const GET_MOVEMENT_WALLET = gql`
  query GetMovementWallet($movementId: String!) {
    movementWallet(movementId: $movementId) {
      id
      movementId
      balance
      ledgerBalance
      status
      createdAt
      updatedAt
      movement {
        id
        name
        logo
      }
    }
  }
`

export const GET_USER_MOVEMENTS = gql`
  query GetUserMovements {
    userMovements {
      id
      name
      slug
      logo
      wallet {
        id
        balance
        status
      }
    }
  }
`

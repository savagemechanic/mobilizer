import { gql } from '@apollo/client'

export const FUND_ORG_WALLET = gql`
  mutation FundOrgWallet($input: FundWalletInput!) {
    fundOrgWallet(input: $input) {
      id
      walletId
      type
      amount
      balanceBefore
      balanceAfter
      status
      reference
      description
      createdAt
    }
  }
`

export const DISBURSE_FUNDS = gql`
  mutation DisburseFunds($input: DisbursementInput!) {
    disburseFunds(input: $input) {
      success
      message
      transaction {
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
        }
        createdAt
      }
    }
  }
`

export const BULK_DISBURSE_FUNDS = gql`
  mutation BulkDisburseFunds($input: BulkDisbursementInput!) {
    bulkDisburseFunds(input: $input) {
      totalRequested
      successful
      failed
      totalAmountDisbursed
      results {
        success
        message
        transaction {
          id
          amount
          reference
          recipient {
            firstName
            lastName
          }
        }
      }
    }
  }
`

export const FUND_MOVEMENT_WALLET = gql`
  mutation FundMovementWallet($input: FundMovementWalletInput!) {
    fundMovementWallet(input: $input) {
      id
      type
      amount
      balanceBefore
      balanceAfter
      status
      reference
      description
      createdAt
    }
  }
`

export const FUND_ORG_FROM_MOVEMENT = gql`
  mutation FundOrgFromMovement($input: FundOrgFromMovementInput!) {
    fundOrgFromMovement(input: $input) {
      id
      walletId
      type
      amount
      balanceBefore
      balanceAfter
      status
      reference
      description
      createdAt
    }
  }
`

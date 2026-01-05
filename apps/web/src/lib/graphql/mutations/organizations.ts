import { gql } from '@apollo/client'

export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($input: CreateOrgInput!) {
    createOrganization(input: $input) {
      id
      name
      slug
      description
      level
      logo
      banner
      memberCount
      isActive
      movement {
        id
        name
      }
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
      createdAt
    }
  }
`

export const JOIN_ORGANIZATION = gql`
  mutation JoinOrganization($orgId: String!) {
    joinOrganization(orgId: $orgId) {
      id
      userId
      organizationId
      isAdmin
      joinedAt
    }
  }
`

export const LEAVE_ORGANIZATION = gql`
  mutation LeaveOrganization($orgId: String!) {
    leaveOrganization(orgId: $orgId)
  }
`

export const UPDATE_MEMBER_ROLE = gql`
  mutation UpdateMemberRole($membershipId: String!, $isAdmin: Boolean!) {
    updateMemberRole(membershipId: $membershipId, isAdmin: $isAdmin) {
      id
      userId
      orgId
      isAdmin
      isActive
      joinedAt
      approvedAt
      user {
        id
        firstName
        lastName
        displayName
        email
        avatar
      }
      organization {
        id
        name
        level
      }
    }
  }
`

export const MAKE_LEADER = gql`
  mutation MakeLeader($input: MakeLeaderInput!) {
    makeLeader(input: $input) {
      id
      userId
      orgId
      isAdmin
      isLeader
      leaderLevel
      leaderState {
        id
        name
      }
      leaderLga {
        id
        name
      }
      leaderWard {
        id
        name
      }
      leaderPollingUnit {
        id
        name
      }
      leaderAssignedAt
      user {
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

export const REMOVE_LEADER = gql`
  mutation RemoveLeader($membershipId: String!) {
    removeLeader(membershipId: $membershipId) {
      id
      isLeader
      leaderLevel
    }
  }
`

export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($id: String!, $input: UpdateOrgInput!) {
    updateOrganization(id: $id, input: $input) {
      id
      name
      slug
      description
      level
      logo
      banner
      memberCount
      isActive
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
      updatedAt
    }
  }
`

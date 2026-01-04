import { gql } from '@apollo/client';

/**
 * Fragment for organization summary information
 */
export const ORGANIZATION_FRAGMENT = gql`
  fragment OrganizationFields on OrganizationEntity {
    id
    name
    slug
    description
    logo
    banner
    level
    isActive
    isVerified
    memberCount
    inviteCode
    movementId
    countryId
    stateId
    lgaId
    wardId
    pollingUnitId
    parentId
    createdAt
    updatedAt
  }
`;

/**
 * Query to fetch organizations with filters
 */
export const GET_ORGANIZATIONS = gql`
  ${ORGANIZATION_FRAGMENT}
  query GetOrganizations(
    $filter: OrganizationFilterInput
    $limit: Float
    $offset: Float
  ) {
    organizations(filter: $filter, limit: $limit, offset: $offset) {
      ...OrganizationFields
    }
  }
`;

/**
 * Query to fetch a single organization by ID
 */
export const GET_ORGANIZATION = gql`
  ${ORGANIZATION_FRAGMENT}
  query GetOrganization($id: String!) {
    organization(id: $id) {
      ...OrganizationFields
    }
  }
`;

/**
 * Query to fetch a single organization by slug
 */
export const GET_ORGANIZATION_BY_SLUG = gql`
  ${ORGANIZATION_FRAGMENT}
  query GetOrganizationBySlug($slug: String!) {
    organizationBySlug(slug: $slug) {
      ...OrganizationFields
    }
  }
`;

/**
 * Query to fetch a single organization by invite code
 */
export const GET_ORGANIZATION_BY_CODE = gql`
  ${ORGANIZATION_FRAGMENT}
  query GetOrganizationByCode($code: String!) {
    organizationByCode(code: $code) {
      ...OrganizationFields
    }
  }
`;

/**
 * Query to fetch user's organizations
 */
export const GET_MY_ORGANIZATIONS = gql`
  ${ORGANIZATION_FRAGMENT}
  query GetMyOrganizations {
    myOrganizations {
      ...OrganizationFields
    }
  }
`;

/**
 * Fragment for organization membership
 */
export const ORG_MEMBERSHIP_FRAGMENT = gql`
  fragment OrgMembershipFields on OrgMembershipEntity {
    id
    userId
    orgId
    isAdmin
    isLeader
    isActive
    leaderLevel
    leaderStateId
    leaderLgaId
    leaderWardId
    leaderPollingUnitId
    leaderAssignedBy
    leaderAssignedAt
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
      slug
      level
      logo
    }
  }
`;

/**
 * Query to fetch organization members
 */
export const GET_ORG_MEMBERS = gql`
  ${ORG_MEMBERSHIP_FRAGMENT}
  query GetOrgMembers(
    $orgId: String!
    $search: String
    $isAdmin: Boolean
    $limit: Float
    $offset: Float
  ) {
    getOrgMembers(
      orgId: $orgId
      search: $search
      isAdmin: $isAdmin
      limit: $limit
      offset: $offset
    ) {
      ...OrgMembershipFields
    }
  }
`;

/**
 * Query to fetch user memberships
 */
export const GET_USER_MEMBERSHIPS = gql`
  ${ORG_MEMBERSHIP_FRAGMENT}
  query GetUserMemberships($userId: String!) {
    userMemberships(userId: $userId) {
      ...OrgMembershipFields
    }
  }
`;

/**
 * Query to fetch organizations for the selector component
 * Returns user's orgs sorted by joinedAt (newest first) + Public org info
 */
export const GET_ORGANIZATIONS_FOR_SELECTOR = gql`
  query GetOrganizationsForSelector {
    myOrganizationsForSelector {
      organizations {
        id
        name
        slug
        description
        logo
        level
        memberCount
        joinedAt
      }
      publicOrg {
        id
        name
        slug
        description
        logo
        level
        memberCount
      }
      publicOrgEnabled
      showAllOrgsOption
    }
  }
`;

/**
 * Query to fetch the public organization
 */
export const GET_PUBLIC_ORGANIZATION = gql`
  query GetPublicOrganization {
    publicOrganization {
      id
      name
      slug
      description
      logo
      level
      memberCount
    }
  }
`;

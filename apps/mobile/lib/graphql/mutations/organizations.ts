import { gql } from '@apollo/client';
import { ORGANIZATION_FRAGMENT, ORG_MEMBERSHIP_FRAGMENT } from '../queries/organizations';

/**
 * Mutation to join an organization
 */
export const JOIN_ORGANIZATION = gql`
  ${ORG_MEMBERSHIP_FRAGMENT}
  mutation JoinOrganization($orgId: String!) {
    joinOrganization(orgId: $orgId) {
      ...OrgMembershipFields
    }
  }
`;

/**
 * Mutation to leave an organization
 */
export const LEAVE_ORGANIZATION = gql`
  mutation LeaveOrganization($orgId: String!) {
    leaveOrganization(orgId: $orgId)
  }
`;

/**
 * Input type for creating an organization
 */
export interface CreateOrgInput {
  name: string;
  description?: string;
  level: string;
  movementId: string;
  logo?: string;
  banner?: string;
  countryId?: string;
  stateId?: string;
  lgaId?: string;
  wardId?: string;
  pollingUnitId?: string;
  parentId?: string;
}

/**
 * Mutation to create an organization
 */
export const CREATE_ORGANIZATION = gql`
  ${ORGANIZATION_FRAGMENT}
  mutation CreateOrganization($input: CreateOrgInput!) {
    createOrganization(input: $input) {
      ...OrganizationFields
    }
  }
`;

/**
 * Mutation to update member role (admin only)
 */
export const UPDATE_MEMBER_ROLE = gql`
  ${ORG_MEMBERSHIP_FRAGMENT}
  mutation UpdateMemberRole($membershipId: String!, $isAdmin: Boolean!) {
    updateMemberRole(membershipId: $membershipId, isAdmin: $isAdmin) {
      ...OrgMembershipFields
    }
  }
`;

/**
 * Input type for making a member a leader
 */
export interface MakeLeaderInput {
  membershipId: string;
  level: string; // LeaderLevel enum: STATE, LGA, WARD, POLLING_UNIT
  stateId?: string;
  lgaId?: string;
  wardId?: string;
  pollingUnitId?: string;
}

/**
 * Mutation to assign a member as a leader
 */
export const MAKE_LEADER = gql`
  ${ORG_MEMBERSHIP_FRAGMENT}
  mutation MakeLeader($input: MakeLeaderInput!) {
    makeLeader(input: $input) {
      ...OrgMembershipFields
    }
  }
`;

/**
 * Mutation to remove leader status
 */
export const REMOVE_LEADER = gql`
  ${ORG_MEMBERSHIP_FRAGMENT}
  mutation RemoveLeader($membershipId: String!) {
    removeLeader(membershipId: $membershipId) {
      ...OrgMembershipFields
    }
  }
`;

/**
 * Mutation to join an organization using invite code
 */
export const JOIN_ORGANIZATION_BY_CODE = gql`
  ${ORG_MEMBERSHIP_FRAGMENT}
  mutation JoinOrganizationByCode($code: String!) {
    joinOrganizationByCode(code: $code) {
      ...OrgMembershipFields
    }
  }
`;

/**
 * Mutation to regenerate organization invite code (admin only)
 */
export const REGENERATE_INVITE_CODE = gql`
  ${ORGANIZATION_FRAGMENT}
  mutation RegenerateInviteCode($orgId: String!) {
    regenerateInviteCode(orgId: $orgId) {
      ...OrganizationFields
    }
  }
`;

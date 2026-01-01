import { gql } from '@apollo/client';

export const GET_ORGANIZATION_AI_SUMMARY = gql`
  query GetOrganizationAISummary($orgId: String!) {
    organizationAISummary(orgId: $orgId) {
      summary
      suggestions
      generatedAt
    }
  }
`;

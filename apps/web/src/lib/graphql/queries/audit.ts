import { gql } from '@apollo/client'

// ============================================
// AUDIT LOGS
// ============================================

export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($filter: AuditFilterInput, $pagination: PaginationInput) {
    auditLogs(filter: $filter, pagination: $pagination) {
      data {
        id
        userId
        user {
          id
          firstName
          lastName
          displayName
          email
          avatar
        }
        action
        entityType
        entityId
        metadata
        ipAddress
        userAgent
        createdAt
      }
      total
      page
      limit
      totalPages
    }
  }
`

export const GET_AUDIT_LOG = gql`
  query GetAuditLog($id: String!) {
    auditLog(id: $id) {
      id
      userId
      user {
        id
        firstName
        lastName
        displayName
        email
        avatar
      }
      action
      entityType
      entityId
      metadata
      ipAddress
      userAgent
      createdAt
    }
  }
`

export const GET_AUDIT_ACTION_TYPES = gql`
  query GetAuditActionTypes {
    auditActionTypes
  }
`

export const GET_AUDIT_ENTITY_TYPES = gql`
  query GetAuditEntityTypes {
    auditEntityTypes
  }
`

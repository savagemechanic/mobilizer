import { gql } from '@apollo/client'

// ============================================
// AUDIT LOGS MUTATIONS
// ============================================

export const EXPORT_AUDIT_LOGS = gql`
  mutation ExportAuditLogs($filter: AuditFilterInput, $format: String) {
    exportAuditLogs(filter: $filter, format: $format) {
      url
      format
      expiresAt
    }
  }
`

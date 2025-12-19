import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

export const AUDIT_METADATA_KEY = 'audit';

export interface AuditMetadata {
  action: AuditAction;
  entityType: string;
}

/**
 * Decorator to mark methods for automatic auditing
 * @param action - The audit action to log
 * @param entityType - The type of entity being acted upon
 *
 * @example
 * ```typescript
 * @Audit(AuditAction.CREATE, 'Organization')
 * async createOrganization(input: CreateOrganizationInput) {
 *   // ...
 * }
 * ```
 */
export const Audit = (action: AuditAction, entityType: string) =>
  SetMetadata(AUDIT_METADATA_KEY, { action, entityType } as AuditMetadata);

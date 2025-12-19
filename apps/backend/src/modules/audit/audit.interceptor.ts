import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import {
  AUDIT_METADATA_KEY,
  AuditMetadata,
} from './decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditService: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext();
    const request = ctx.req;
    const user = request?.user;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          // Extract entity ID from the result if it's an object with an id property
          const entityId =
            result && typeof result === 'object' && 'id' in result
              ? result.id
              : undefined;

          // Extract metadata from result
          const metadata: any = {};
          if (result && typeof result === 'object') {
            // Add relevant fields to metadata (excluding sensitive data)
            const allowedFields = [
              'name',
              'slug',
              'email',
              'level',
              'type',
              'status',
            ];
            for (const field of allowedFields) {
              if (field in result) {
                metadata[field] = result[field];
              }
            }
          }

          await this.auditService.log({
            userId: user?.id,
            action: auditMetadata.action,
            entityType: auditMetadata.entityType,
            entityId,
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            ipAddress: this.extractIpAddress(request),
            userAgent: request?.headers?.['user-agent'],
          });
        } catch (error) {
          // Log error but don't fail the request
          console.error('Failed to create audit log:', error);
        }
      }),
    );
  }

  private extractIpAddress(request: any): string | undefined {
    if (!request) return undefined;

    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress
    );
  }
}

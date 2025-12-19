import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import {
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  AuditLogEntity,
  AuditLogPaginated,
  ExportAuditLogsResponse,
} from './entities/audit-log.entity';
import { AuditFilterInput } from './dto/audit-filter.input';
import { PaginationInput } from './dto/pagination.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditAction } from '@prisma/client';

@Resolver(() => AuditLogEntity)
export class AuditResolver {
  constructor(private auditService: AuditService) {}

  @Query(() => AuditLogPaginated, {
    description: 'Get all audit logs with filters and pagination',
  })
  @UseGuards(GqlAuthGuard)
  async auditLogs(
    @CurrentUser() user: any,
    @Args('filter', { nullable: true }) filter?: AuditFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<AuditLogPaginated> {
    // Only Super Admin or Platform Admin can view audit logs
    this.checkAdminPermission(user);

    return this.auditService.findAll(filter, pagination);
  }

  @Query(() => AuditLogEntity, {
    description: 'Get a single audit log by ID',
  })
  @UseGuards(GqlAuthGuard)
  async auditLog(
    @CurrentUser() user: any,
    @Args('id') id: string,
  ): Promise<AuditLogEntity> {
    // Only Super Admin or Platform Admin can view audit logs
    this.checkAdminPermission(user);

    return this.auditService.findOne(id);
  }

  @Query(() => [String], {
    description: 'Get all available audit action types',
  })
  @UseGuards(GqlAuthGuard)
  async auditActionTypes(@CurrentUser() user: any): Promise<AuditAction[]> {
    // Only Super Admin or Platform Admin can view audit action types
    this.checkAdminPermission(user);

    return this.auditService.getActionTypes();
  }

  @Query(() => [String], {
    description: 'Get all unique entity types from audit logs',
  })
  @UseGuards(GqlAuthGuard)
  async auditEntityTypes(@CurrentUser() user: any): Promise<string[]> {
    // Only Super Admin or Platform Admin can view entity types
    this.checkAdminPermission(user);

    return this.auditService.getEntityTypes();
  }

  @Mutation(() => ExportAuditLogsResponse, {
    description: 'Export audit logs to CSV or JSON',
  })
  @UseGuards(GqlAuthGuard)
  async exportAuditLogs(
    @CurrentUser() user: any,
    @Args('filter', { nullable: true }) filter?: AuditFilterInput,
    @Args('format', { nullable: true, defaultValue: 'csv' })
    format?: string,
  ): Promise<ExportAuditLogsResponse> {
    // Only Super Admin or Platform Admin can export audit logs
    this.checkAdminPermission(user);

    // Validate format
    if (format !== 'csv' && format !== 'json') {
      throw new BadRequestException('Format must be either "csv" or "json"');
    }

    return this.auditService.exportLogs(filter, format as 'csv' | 'json');
  }

  /**
   * Helper method to check if user has admin permission
   * User must be either:
   * - Platform Admin (isPlatformAdmin = true)
   * - Super Admin of at least one movement
   */
  private checkAdminPermission(user: any): void {
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user is Platform Admin
    if (user.isPlatformAdmin) {
      return;
    }

    // Check if user is Super Admin of any movement
    // This would require checking the MovementAdmin table
    // For now, we'll only allow Platform Admins
    // TODO: Implement Super Admin check when movement context is available

    throw new ForbiddenException(
      'Only Platform Admins or Super Admins can access audit logs',
    );
  }
}

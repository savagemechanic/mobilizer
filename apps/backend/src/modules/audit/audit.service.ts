import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditFilterInput } from './dto/audit-filter.input';
import { PaginationInput } from './dto/pagination.input';
import { AuditLogPaginated } from './entities/audit-log.entity';
import { createObjectCsvWriter } from 'csv-writer';
import { join } from 'path';
import { promises as fs } from 'fs';

export interface LogAuditParams {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async log(params: LogAuditParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: params.metadata,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      // Log the error but don't throw - audit logging should not break the main flow
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Find all audit logs with filters and pagination
   */
  async findAll(
    filter?: AuditFilterInput,
    pagination?: PaginationInput,
  ): Promise<AuditLogPaginated> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    // Build where clause
    const where: any = {};

    if (filter?.userId) {
      where.userId = filter.userId;
    }

    if (filter?.action) {
      where.action = filter.action;
    }

    if (filter?.entityType) {
      where.entityType = filter.entityType;
    }

    if (filter?.entityId) {
      where.entityId = filter.entityId;
    }

    if (filter?.ipAddress) {
      where.ipAddress = filter.ipAddress;
    }

    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.createdAt.lte = filter.endDate;
      }
    }

    // Handle search across multiple fields
    if (filter?.search) {
      where.OR = [
        { entityType: { contains: filter.search, mode: 'insensitive' } },
        { entityId: { contains: filter.search, mode: 'insensitive' } },
        { ipAddress: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    // Handle movementId filter (search in metadata)
    if (filter?.movementId) {
      where.metadata = {
        path: ['movementId'],
        equals: filter.movementId,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Find a single audit log by ID
   */
  async findOne(id: string) {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return auditLog;
  }

  /**
   * Get all available audit action types
   */
  getActionTypes(): AuditAction[] {
    return Object.values(AuditAction);
  }

  /**
   * Get all unique entity types from audit logs
   */
  async getEntityTypes(): Promise<string[]> {
    const entityTypes = await this.prisma.auditLog.findMany({
      select: {
        entityType: true,
      },
      distinct: ['entityType'],
    });

    return entityTypes.map((et) => et.entityType).sort();
  }

  /**
   * Export audit logs to CSV or JSON
   */
  async exportLogs(
    filter?: AuditFilterInput,
    format: 'csv' | 'json' = 'csv',
  ): Promise<{ url: string; format: string; expiresAt: Date }> {
    // Fetch all matching logs (without pagination)
    const where: any = this.buildWhereClause(filter);

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10000, // Limit to prevent memory issues
    });

    const timestamp = Date.now();
    const fileName = `audit-logs-${timestamp}.${format}`;
    const filePath = join(process.cwd(), 'tmp', fileName);

    // Ensure tmp directory exists
    await fs.mkdir(join(process.cwd(), 'tmp'), { recursive: true });

    if (format === 'csv') {
      await this.exportToCsv(logs, filePath);
    } else {
      await this.exportToJson(logs, filePath);
    }

    // In a real application, upload to S3 or similar and return the URL
    // For now, return a placeholder URL
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    return {
      url: `/downloads/${fileName}`,
      format,
      expiresAt,
    };
  }

  /**
   * Helper: Log user-specific actions
   */
  async logUserAction(
    userId: string,
    action: AuditAction,
    entityType: string,
    entityId?: string,
    metadata?: any,
    request?: any,
  ): Promise<void> {
    return this.log({
      userId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: this.extractIpAddress(request),
      userAgent: request?.headers?.['user-agent'],
    });
  }

  /**
   * Helper: Log movement-specific actions
   */
  async logMovementAction(
    userId: string,
    action: AuditAction,
    movementId: string,
    entityType: string,
    entityId?: string,
    metadata?: any,
    request?: any,
  ): Promise<void> {
    return this.log({
      userId,
      action,
      entityType,
      entityId,
      metadata: {
        ...metadata,
        movementId,
      },
      ipAddress: this.extractIpAddress(request),
      userAgent: request?.headers?.['user-agent'],
    });
  }

  /**
   * Helper: Log organization-specific actions
   */
  async logOrgAction(
    userId: string,
    action: AuditAction,
    orgId: string,
    entityType: string,
    entityId?: string,
    metadata?: any,
    request?: any,
  ): Promise<void> {
    return this.log({
      userId,
      action,
      entityType,
      entityId,
      metadata: {
        ...metadata,
        orgId,
      },
      ipAddress: this.extractIpAddress(request),
      userAgent: request?.headers?.['user-agent'],
    });
  }

  // Private helper methods

  private buildWhereClause(filter?: AuditFilterInput): any {
    const where: any = {};

    if (filter?.userId) {
      where.userId = filter.userId;
    }

    if (filter?.action) {
      where.action = filter.action;
    }

    if (filter?.entityType) {
      where.entityType = filter.entityType;
    }

    if (filter?.entityId) {
      where.entityId = filter.entityId;
    }

    if (filter?.ipAddress) {
      where.ipAddress = filter.ipAddress;
    }

    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.createdAt.lte = filter.endDate;
      }
    }

    if (filter?.search) {
      where.OR = [
        { entityType: { contains: filter.search, mode: 'insensitive' } },
        { entityId: { contains: filter.search, mode: 'insensitive' } },
        { ipAddress: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter?.movementId) {
      where.metadata = {
        path: ['movementId'],
        equals: filter.movementId,
      };
    }

    return where;
  }

  private async exportToCsv(logs: any[], filePath: string): Promise<void> {
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'userId', title: 'User ID' },
        { id: 'userEmail', title: 'User Email' },
        { id: 'action', title: 'Action' },
        { id: 'entityType', title: 'Entity Type' },
        { id: 'entityId', title: 'Entity ID' },
        { id: 'metadata', title: 'Metadata' },
        { id: 'ipAddress', title: 'IP Address' },
        { id: 'userAgent', title: 'User Agent' },
        { id: 'createdAt', title: 'Created At' },
      ],
    });

    const records = logs.map((log) => ({
      id: log.id,
      userId: log.userId || '',
      userEmail: log.user?.email || '',
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId || '',
      metadata: log.metadata ? JSON.stringify(log.metadata) : '',
      ipAddress: log.ipAddress || '',
      userAgent: log.userAgent || '',
      createdAt: log.createdAt.toISOString(),
    }));

    await csvWriter.writeRecords(records);
  }

  private async exportToJson(logs: any[], filePath: string): Promise<void> {
    const data = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      user: log.user
        ? {
            id: log.user.id,
            email: log.user.email,
            firstName: log.user.firstName,
            lastName: log.user.lastName,
          }
        : null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    }));

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private extractIpAddress(request: any): string | undefined {
    if (!request) return undefined;

    return (
      request.headers?.['x-forwarded-for']?.split(',')[0] ||
      request.headers?.['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress
    );
  }
}

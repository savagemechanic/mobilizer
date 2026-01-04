import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserFilterInput } from './dto/user-filter.input';
import { CreatePlatformAdminUserInput } from './dto/create-platform-admin-user.input';
import { PlatformStats } from './entities/platform-stats.entity';
import { SystemHealth } from './entities/system-health.entity';

@Injectable()
export class PlatformAdminService {
  constructor(private prisma: PrismaService) {}

  async getPlatformStats(): Promise<PlatformStats> {
    // Get total counts
    const [
      totalMovements,
      totalSupportGroups,
      totalUsers,
      totalPosts,
      totalEvents,
    ] = await Promise.all([
      this.prisma.movement.count(),
      this.prisma.organization.count(),
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.event.count(),
    ]);

    // Get active users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeUsersToday = await this.prisma.user.count({
      where: {
        lastLoginAt: {
          gte: today,
        },
      },
    });

    // Get new users this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersThisWeek = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    // Get movement summaries with support group and member counts
    const movements = await this.prisma.movement.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            supportGroups: true,
          },
        },
        supportGroups: {
          include: {
            _count: {
              select: {
                memberships: true,
              },
            },
          },
        },
      },
    });

    const movementSummaries = movements.map((movement) => ({
      id: movement.id,
      name: movement.name,
      supportGroupsCount: movement._count.supportGroups,
      membersCount: movement.supportGroups.reduce(
        (total, org) => total + org._count.memberships,
        0,
      ),
    }));

    return {
      totalMovements,
      totalSupportGroups,
      totalUsers,
      totalPosts,
      totalEvents,
      activeUsersToday,
      newUsersThisWeek,
      movementSummaries,
    };
  }

  async getAllUsers(
    filter?: UserFilterInput,
    limit: number = 20,
    offset: number = 0,
  ) {
    const where: any = {};

    if (filter) {
      if (filter.search) {
        where.OR = [
          { firstName: { contains: filter.search, mode: 'insensitive' } },
          { lastName: { contains: filter.search, mode: 'insensitive' } },
          { displayName: { contains: filter.search, mode: 'insensitive' } },
          { email: { contains: filter.search, mode: 'insensitive' } },
        ];
      }

      if (filter.isActive !== undefined) {
        where.isActive = filter.isActive;
      }

      if (filter.isSuspended !== undefined) {
        where.isSuspended = filter.isSuspended;
      }

      if (filter.isPlatformAdmin !== undefined) {
        where.isPlatformAdmin = filter.isPlatformAdmin;
      }
    }

    // Get total count and users in parallel
    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          middleName: true,
          displayName: true,
          avatar: true,
          bio: true,
          phoneNumber: true,
          isEmailVerified: true,
          isActive: true,
          isSuspended: true,
          suspendedReason: true,
          suspendedAt: true,
          isPlatformAdmin: true,
          lastLoginAt: true,
          createdAt: true,
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Calculate if there are more pages
    const hasMore = offset + users.length < totalCount;

    return {
      items: users,
      totalCount,
      hasMore,
    };
  }

  async grantPlatformAdmin(userId: string, grantedBy: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isPlatformAdmin) {
      throw new BadRequestException('User is already a platform admin');
    }

    // Update user to platform admin
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isPlatformAdmin: true },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: grantedBy,
        action: 'PLATFORM_ADMIN_GRANT',
        entityType: 'User',
        entityId: userId,
        metadata: {
          grantedTo: userId,
          grantedBy,
        },
      },
    });

    return updatedUser;
  }

  async revokePlatformAdmin(userId: string, revokedBy: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isPlatformAdmin) {
      throw new BadRequestException('User is not a platform admin');
    }

    // Update user to remove platform admin
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isPlatformAdmin: false },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: revokedBy,
        action: 'PLATFORM_ADMIN_REVOKE',
        entityType: 'User',
        entityId: userId,
        metadata: {
          revokedFrom: userId,
          revokedBy,
        },
      },
    });

    return updatedUser;
  }

  async getPlatformAdmins() {
    const admins = await this.prisma.user.findMany({
      where: {
        isPlatformAdmin: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return admins;
  }

  async suspendUser(userId: string, reason: string, suspendedBy: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isSuspended) {
      throw new BadRequestException('User is already suspended');
    }

    // Don't allow suspending platform admins
    if (user.isPlatformAdmin) {
      throw new BadRequestException('Cannot suspend a platform admin');
    }

    // Update user to suspended
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendedReason: reason,
        isActive: false,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: suspendedBy,
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        metadata: {
          action: 'suspend',
          reason,
          suspendedBy,
        },
      },
    });

    return updatedUser;
  }

  async unsuspendUser(userId: string, unsuspendedBy: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isSuspended) {
      throw new BadRequestException('User is not suspended');
    }

    // Update user to unsuspended
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        suspendedAt: null,
        suspendedReason: null,
        isActive: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: unsuspendedBy,
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        metadata: {
          action: 'unsuspend',
          unsuspendedBy,
        },
      },
    });

    return updatedUser;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    let databaseConnected = false;

    try {
      // Try to query the database
      await this.prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;
    } catch (error) {
      databaseConnected = false;
    }

    return {
      status: databaseConnected ? 'healthy' : 'unhealthy',
      databaseConnected,
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }

  async createPlatformAdminUser(input: CreatePlatformAdminUserInput, createdBy: string) {
    // Check if user with email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email },
          ...(input.phoneNumber ? [{ phoneNumber: input.phoneNumber }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone number already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName,
        phoneNumber: input.phoneNumber,
        displayName: `${input.firstName} ${input.lastName}`,
        isPlatformAdmin: input.isPlatformAdmin ?? true,
        isEmailVerified: true, // Admin-created users are pre-verified
        isActive: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: 'CREATE',
        entityType: 'User',
        entityId: user.id,
        metadata: {
          action: 'create_platform_admin_user',
          createdUserId: user.id,
          createdUserEmail: user.email,
          isPlatformAdmin: user.isPlatformAdmin,
          createdBy,
        },
      },
    });

    return user;
  }

  /**
   * Get platform settings
   */
  async getPlatformSettings() {
    let settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'default' },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await this.prisma.platformSettings.create({
        data: {
          id: 'default',
          publicOrgEnabled: true,
        },
      });
    }

    return settings;
  }

  /**
   * Toggle public organization on/off
   */
  async togglePublicOrg(enabled: boolean, userId: string) {
    const settings = await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: { publicOrgEnabled: enabled },
      create: {
        id: 'default',
        publicOrgEnabled: enabled,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entityType: 'PlatformSettings',
        entityId: 'default',
        metadata: {
          action: 'toggle_public_org',
          publicOrgEnabled: enabled,
        },
      },
    });

    return settings;
  }

  /**
   * Set the public organization ID
   */
  async setPublicOrgId(orgId: string, userId: string) {
    const settings = await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: { publicOrgId: orgId },
      create: {
        id: 'default',
        publicOrgEnabled: true,
        publicOrgId: orgId,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entityType: 'PlatformSettings',
        entityId: 'default',
        metadata: {
          action: 'set_public_org_id',
          publicOrgId: orgId,
        },
      },
    });

    return settings;
  }
}

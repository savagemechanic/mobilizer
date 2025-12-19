import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMovementInput } from './dto/create-movement.input';
import { UpdateMovementInput } from './dto/update-movement.input';
import { MovementFilterInput } from './dto/movement-filter.input';
import { MovementStats, MembersByLevel, RecentActivity } from './entities/movement-stats.entity';

@Injectable()
export class MovementsService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all movements with optional filtering and pagination
   */
  async findAll(filter?: MovementFilterInput, limit: number = 20, offset: number = 0) {
    const where: any = {};

    if (filter) {
      if (filter.isActive !== undefined) {
        where.isActive = filter.isActive;
      }
      if (filter.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ];
      }
    }

    const movements = await this.prisma.movement.findMany({
      where,
      include: {
        superAdmins: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            supportGroups: true,
            superAdmins: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    // Transform superAdmins to extract user data for GraphQL
    return movements.map((movement) => ({
      ...movement,
      superAdmins: movement.superAdmins?.map((admin) => admin.user) || [],
    }));
  }

  /**
   * Get single movement by ID with support groups count
   */
  async findOne(id: string) {
    const movement = await this.prisma.movement.findUnique({
      where: { id },
      include: {
        supportGroups: {
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
            memberCount: true,
            isActive: true,
          },
        },
        superAdmins: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            supportGroups: true,
            superAdmins: true,
          },
        },
      },
    });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    // Transform superAdmins to extract user data for GraphQL
    return {
      ...movement,
      superAdmins: movement.superAdmins?.map((admin) => admin.user) || [],
    };
  }

  /**
   * Get movement by slug
   */
  async findBySlug(slug: string) {
    const movement = await this.prisma.movement.findUnique({
      where: { slug },
      include: {
        supportGroups: {
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
            memberCount: true,
            isActive: true,
          },
        },
        superAdmins: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            supportGroups: true,
            superAdmins: true,
          },
        },
      },
    });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    // Transform superAdmins to extract user data for GraphQL
    return {
      ...movement,
      superAdmins: movement.superAdmins?.map((admin) => admin.user) || [],
    };
  }

  /**
   * Create a new movement (Platform Admin only)
   */
  async create(input: CreateMovementInput, userId: string) {
    // Generate slug from name
    const slug = this.generateSlug(input.name);

    // Check if slug already exists
    const existingMovement = await this.prisma.movement.findUnique({
      where: { slug },
    });

    if (existingMovement) {
      throw new ConflictException('Movement with this name already exists');
    }

    // Create movement
    const movement = await this.prisma.movement.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        logo: input.logo,
        banner: input.banner,
        website: input.website,
        createdById: userId,
      },
      include: {
        _count: {
          select: {
            supportGroups: true,
            superAdmins: true,
          },
        },
      },
    });

    return movement;
  }

  /**
   * Update a movement (Platform Admin only)
   */
  async update(id: string, input: UpdateMovementInput) {
    const movement = await this.prisma.movement.findUnique({
      where: { id },
    });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    // If name is being updated, regenerate slug
    let slug: string | undefined;
    if (input.name) {
      slug = this.generateSlug(input.name);

      // Check if new slug conflicts with existing movement
      const existingMovement = await this.prisma.movement.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (existingMovement) {
        throw new ConflictException('Movement with this name already exists');
      }
    }

    const updatedMovement = await this.prisma.movement.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name, slug }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.logo !== undefined && { logo: input.logo }),
        ...(input.banner !== undefined && { banner: input.banner }),
        ...(input.website !== undefined && { website: input.website }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      include: {
        _count: {
          select: {
            supportGroups: true,
            superAdmins: true,
          },
        },
      },
    });

    return updatedMovement;
  }

  /**
   * Soft delete a movement (Platform Admin only)
   */
  async delete(id: string) {
    const movement = await this.prisma.movement.findUnique({
      where: { id },
    });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    await this.prisma.movement.update({
      where: { id },
      data: { isActive: false },
    });

    return true;
  }

  /**
   * Assign a Super Admin to a movement (Platform Admin only)
   */
  async assignSuperAdmin(movementId: string, userId: string, assignedBy: string) {
    const movement = await this.prisma.movement.findUnique({
      where: { id: movementId },
    });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already a super admin
    const existingAdmin = await this.prisma.movementAdmin.findUnique({
      where: {
        movementId_userId: {
          movementId,
          userId,
        },
      },
    });

    if (existingAdmin) {
      throw new ConflictException('User is already a Super Admin for this movement');
    }

    const movementAdmin = await this.prisma.movementAdmin.create({
      data: {
        movementId,
        userId,
        assignedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
            avatar: true,
          },
        },
        movement: true,
      },
    });

    return movementAdmin;
  }

  /**
   * Revoke Super Admin privileges from a user (Platform Admin only)
   */
  async revokeSuperAdmin(movementId: string, userId: string) {
    const movementAdmin = await this.prisma.movementAdmin.findUnique({
      where: {
        movementId_userId: {
          movementId,
          userId,
        },
      },
    });

    if (!movementAdmin) {
      throw new NotFoundException('Super Admin assignment not found');
    }

    await this.prisma.movementAdmin.delete({
      where: {
        movementId_userId: {
          movementId,
          userId,
        },
      },
    });

    return true;
  }

  /**
   * Get all Super Admins for a movement
   */
  async getSuperAdmins(movementId: string) {
    const movement = await this.prisma.movement.findUnique({
      where: { id: movementId },
    });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    const superAdmins = await this.prisma.movementAdmin.findMany({
      where: { movementId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
            avatar: true,
            bio: true,
            isActive: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return superAdmins;
  }

  /**
   * Get movement statistics
   */
  async getMovementStats(movementId: string): Promise<MovementStats> {
    const movement = await this.prisma.movement.findUnique({
      where: { id: movementId },
    });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    // Get total support groups
    const totalSupportGroups = await this.prisma.organization.count({
      where: { movementId, isActive: true },
    });

    // Get total members across all support groups
    const totalMembers = await this.prisma.orgMembership.count({
      where: {
        organization: {
          movementId,
          isActive: true,
        },
        isActive: true,
      },
    });

    // Get total posts
    const totalPosts = await this.prisma.post.count({
      where: {
        organization: {
          movementId,
        },
        isPublished: true,
      },
    });

    // Get total events
    const totalEvents = await this.prisma.event.count({
      where: {
        organization: {
          movementId,
        },
        isPublished: true,
      },
    });

    // Get members by organization level
    const membersByLevelData = await this.prisma.organization.groupBy({
      by: ['level'],
      where: {
        movementId,
        isActive: true,
      },
      _sum: {
        memberCount: true,
      },
    });

    const membersByLevel: MembersByLevel = {
      national: 0,
      state: 0,
      lga: 0,
      ward: 0,
    };

    membersByLevelData.forEach((item) => {
      const count = item._sum.memberCount || 0;
      switch (item.level) {
        case 'NATIONAL':
          membersByLevel.national = count;
          break;
        case 'STATE':
          membersByLevel.state = count;
          break;
        case 'LGA':
          membersByLevel.lga = count;
          break;
        case 'WARD':
          membersByLevel.ward = count;
          break;
      }
    });

    // Get recent activity (posts and events)
    const recentPosts = await this.prisma.post.findMany({
      where: {
        organization: {
          movementId,
        },
        isPublished: true,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentEvents = await this.prisma.event.findMany({
      where: {
        organization: {
          movementId,
        },
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentActivity: RecentActivity[] = [
      ...recentPosts.map((post) => ({
        date: post.createdAt,
        type: 'post',
        description: `${post.author.firstName} ${post.author.lastName} created a post`,
        entityId: post.id,
      })),
      ...recentEvents.map((event) => ({
        date: event.createdAt,
        type: 'event',
        description: `New event: ${event.title}`,
        entityId: event.id,
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);

    return {
      totalSupportGroups,
      totalMembers,
      totalPosts,
      totalEvents,
      membersByLevel,
      recentActivity,
    };
  }

  /**
   * Get movements where user is a Super Admin
   */
  async getUserMovements(userId: string) {
    const movementAdmins = await this.prisma.movementAdmin.findMany({
      where: { userId },
      include: {
        movement: {
          include: {
            _count: {
              select: {
                supportGroups: true,
                superAdmins: true,
              },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return movementAdmins.map((ma) => ma.movement);
  }

  /**
   * Check if user is Super Admin for a movement
   */
  async isSuperAdmin(userId: string, movementId: string): Promise<boolean> {
    const movementAdmin = await this.prisma.movementAdmin.findUnique({
      where: {
        movementId_userId: {
          movementId,
          userId,
        },
      },
    });

    return !!movementAdmin;
  }

  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

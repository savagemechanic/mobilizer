import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrgInput } from './dto/create-org.input';
import { UpdateOrgInput } from './dto/update-org.input';
import { OrganizationFilterInput } from './dto/org-filter.input';
import { MakeLeaderInput } from './dto/make-leader.input';
import { LeaderLevel } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: OrganizationFilterInput, limit: number = 20, offset: number = 0) {
    const where: any = {
      isActive: true,
    };

    if (filter) {
      if (filter.level) {
        where.level = filter.level;
      }
      if (filter.stateId) {
        where.stateId = filter.stateId;
      }
      if (filter.lgaId) {
        where.lgaId = filter.lgaId;
      }
      if (filter.wardId) {
        where.wardId = filter.wardId;
      }
      if (filter.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ];
      }
    }

    return this.prisma.organization.findMany({
      where,
      include: {
        parent: true,
        state: true,
        lga: true,
        ward: true,
        _count: {
          select: {
            memberships: true,
            posts: true,
            events: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        state: true,
        lga: true,
        ward: true,
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            posts: true,
            events: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        state: true,
        lga: true,
        ward: true,
        _count: {
          select: {
            memberships: true,
            posts: true,
            events: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async create(userId: string, input: CreateOrgInput) {
    // Validate description length (40 char limit)
    if (input.description && input.description.length > 40) {
      throw new BadRequestException('Description must be 40 characters or less');
    }

    // Generate slug from name
    const slug = this.generateSlug(input.name);

    // Check if slug already exists
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new ConflictException('Organization with this name already exists');
    }

    // Generate invite code
    const inviteCode = await this.generateInviteCode();

    // Create organization
    const org = await this.prisma.organization.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        level: input.level as any,
        logo: input.logo,
        banner: input.banner,
        inviteCode,
        movement: { connect: { id: input.movementId } },
        ...(input.parentId && { parent: { connect: { id: input.parentId } } }),
        ...(input.countryId && { country: { connect: { id: input.countryId } } }),
        ...(input.stateId && { state: { connect: { id: input.stateId } } }),
        ...(input.lgaId && { lga: { connect: { id: input.lgaId } } }),
        ...(input.wardId && { ward: { connect: { id: input.wardId } } }),
        ...(input.pollingUnitId && { pollingUnit: { connect: { id: input.pollingUnitId } } }),
      },
    });

    // Add creator as admin member
    await this.prisma.orgMembership.create({
      data: {
        userId,
        orgId: org.id,
        isAdmin: true,
        approvedAt: new Date(),
      },
    });

    // Update member count
    await this.prisma.organization.update({
      where: { id: org.id },
      data: { memberCount: 1 },
    });

    return org;
  }

  async update(id: string, input: UpdateOrgInput, requesterId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Check if requester is admin of this organization
    const requesterMembership = await this.prisma.orgMembership.findUnique({
      where: {
        userId_orgId: {
          userId: requesterId,
          orgId: id,
        },
      },
    });

    if (!requesterMembership?.isAdmin) {
      throw new ConflictException('Only admins can update organization');
    }

    // If name is being updated, regenerate slug and check for conflicts
    let slug: string | undefined;
    if (input.name) {
      slug = this.generateSlug(input.name);

      // Check if new slug conflicts with existing organization
      const existingOrg = await this.prisma.organization.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (existingOrg) {
        throw new ConflictException('Organization with this name already exists');
      }
    }

    const updatedOrg = await this.prisma.organization.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name, slug }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.logo !== undefined && { logo: input.logo }),
        ...(input.banner !== undefined && { banner: input.banner }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      include: {
        parent: true,
        state: true,
        lga: true,
        ward: true,
        pollingUnit: true,
        country: true,
        _count: {
          select: {
            memberships: true,
            posts: true,
            events: true,
          },
        },
      },
    });

    return updatedOrg;
  }

  async joinOrganization(userId: string, orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Check if already a member
    const existingMembership = await this.prisma.orgMembership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('Already a member of this organization');
    }

    // Create membership
    const membership = await this.prisma.orgMembership.create({
      data: {
        userId,
        orgId,
        approvedAt: new Date(), // Auto-approve for now
      },
      include: {
        organization: true,
      },
    });

    // Update member count
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { memberCount: { increment: 1 } },
    });

    return membership.organization;
  }

  async leaveOrganization(userId: string, orgId: string) {
    const membership = await this.prisma.orgMembership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    await this.prisma.orgMembership.delete({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    // Update member count
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { memberCount: { decrement: 1 } },
    });

    return true;
  }

  async getUserOrganizations(userId: string) {
    const memberships = await this.prisma.orgMembership.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        organization: {
          include: {
            state: true,
            lga: true,
            ward: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => m.organization);
  }

  async getOrgMembers(
    orgId: string,
    filter?: { search?: string; isAdmin?: boolean },
    limit: number = 20,
    offset: number = 0,
  ) {
    const where: any = {
      orgId,
      isActive: true,
    };

    if (filter?.isAdmin !== undefined) {
      where.isAdmin = filter.isAdmin;
    }

    if (filter?.search) {
      where.user = {
        OR: [
          { firstName: { contains: filter.search, mode: 'insensitive' } },
          { lastName: { contains: filter.search, mode: 'insensitive' } },
          { displayName: { contains: filter.search, mode: 'insensitive' } },
          { email: { contains: filter.search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.orgMembership.findMany({
      where,
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
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
            logo: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { joinedAt: 'desc' },
    });
  }

  async updateMemberRole(requesterId: string, membershipId: string, isAdmin: boolean) {
    // Get the membership
    const membership = await this.prisma.orgMembership.findUnique({
      where: { id: membershipId },
      include: { organization: true },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Check if requester is admin of this organization
    const requesterMembership = await this.prisma.orgMembership.findUnique({
      where: {
        userId_orgId: {
          userId: requesterId,
          orgId: membership.orgId,
        },
      },
    });

    if (!requesterMembership?.isAdmin) {
      throw new ConflictException('You must be an admin to update member roles');
    }

    // Update the membership
    return this.prisma.orgMembership.update({
      where: { id: membershipId },
      data: { isAdmin },
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
        organization: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });
  }

  async makeLeader(input: MakeLeaderInput, assignedBy: string) {
    // Get the membership
    const membership = await this.prisma.orgMembership.findUnique({
      where: { id: input.membershipId },
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
        organization: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Validate location IDs based on leader level
    const locationData: any = {
      isLeader: true,
      leaderLevel: input.level,
      leaderAssignedAt: new Date(),
      leaderAssignedBy: assignedBy,
      leaderStateId: null,
      leaderLgaId: null,
      leaderWardId: null,
      leaderPollingUnitId: null,
    };

    switch (input.level) {
      case LeaderLevel.STATE:
        if (!input.stateId) {
          throw new BadRequestException('State ID is required for STATE level leader');
        }
        // Verify state exists
        const state = await this.prisma.state.findUnique({
          where: { id: input.stateId },
        });
        if (!state) {
          throw new NotFoundException('State not found');
        }
        locationData.leaderStateId = input.stateId;
        break;

      case LeaderLevel.LGA:
        if (!input.lgaId) {
          throw new BadRequestException('LGA ID is required for LGA level leader');
        }
        // Verify LGA exists
        const lga = await this.prisma.lGA.findUnique({
          where: { id: input.lgaId },
          include: { state: true },
        });
        if (!lga) {
          throw new NotFoundException('LGA not found');
        }
        locationData.leaderStateId = lga.stateId;
        locationData.leaderLgaId = input.lgaId;
        break;

      case LeaderLevel.WARD:
        if (!input.wardId) {
          throw new BadRequestException('Ward ID is required for WARD level leader');
        }
        // Verify Ward exists
        const ward = await this.prisma.ward.findUnique({
          where: { id: input.wardId },
          include: {
            lga: {
              include: {
                state: true,
              },
            },
          },
        });
        if (!ward) {
          throw new NotFoundException('Ward not found');
        }
        locationData.leaderStateId = ward.lga.stateId;
        locationData.leaderLgaId = ward.lgaId;
        locationData.leaderWardId = input.wardId;
        break;

      case LeaderLevel.POLLING_UNIT:
        if (!input.pollingUnitId) {
          throw new BadRequestException('Polling Unit ID is required for POLLING_UNIT level leader');
        }
        // Verify Polling Unit exists
        const pollingUnit = await this.prisma.pollingUnit.findUnique({
          where: { id: input.pollingUnitId },
          include: {
            ward: {
              include: {
                lga: {
                  include: {
                    state: true,
                  },
                },
              },
            },
          },
        });
        if (!pollingUnit) {
          throw new NotFoundException('Polling Unit not found');
        }
        locationData.leaderStateId = pollingUnit.ward.lga.stateId;
        locationData.leaderLgaId = pollingUnit.ward.lgaId;
        locationData.leaderWardId = pollingUnit.wardId;
        locationData.leaderPollingUnitId = input.pollingUnitId;
        break;

      default:
        throw new BadRequestException('Invalid leader level');
    }

    // Update the membership
    return this.prisma.orgMembership.update({
      where: { id: input.membershipId },
      data: locationData,
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
        organization: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        leaderState: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        leaderLga: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        leaderWard: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        leaderPollingUnit: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async removeLeader(membershipId: string) {
    // Get the membership
    const membership = await this.prisma.orgMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (!membership.isLeader) {
      throw new BadRequestException('Member is not a leader');
    }

    // Remove leader role
    return this.prisma.orgMembership.update({
      where: { id: membershipId },
      data: {
        isLeader: false,
        leaderLevel: null,
        leaderStateId: null,
        leaderLgaId: null,
        leaderWardId: null,
        leaderPollingUnitId: null,
        leaderAssignedAt: null,
        leaderAssignedBy: null,
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
        organization: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate a unique 3-letter uppercase invite code (e.g., APC, PDP, NGA)
   */
  private async generateInviteCode(): Promise<string> {
    // 3-letter uppercase codes (e.g., APC, PDP, NGA)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const length = 3;

    let code: string;
    let attempts = 0;
    const maxAttempts = 50; // More attempts since 3-letter codes have fewer combinations

    do {
      code = Array.from({ length }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('');

      // Check if code already exists
      const existing = await this.prisma.organization.findUnique({
        where: { inviteCode: code },
      });

      if (!existing) {
        return code;
      }

      attempts++;
    } while (attempts < maxAttempts);

    throw new ConflictException('Failed to generate unique invite code. Try a custom code.');
  }

  /**
   * Find organization by invite code
   */
  async findByInviteCode(code: string) {
    const org = await this.prisma.organization.findUnique({
      where: { inviteCode: code.toUpperCase() },
      include: {
        state: true,
        lga: true,
        ward: true,
        movement: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Invalid invite code');
    }

    return org;
  }

  /**
   * Join organization using invite code
   */
  async joinOrganizationByCode(userId: string, code: string) {
    const org = await this.prisma.organization.findUnique({
      where: { inviteCode: code.toUpperCase() },
    });

    if (!org) {
      throw new NotFoundException('Invalid invite code');
    }

    // Check if already a member
    const existingMembership = await this.prisma.orgMembership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId: org.id,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('Already a member of this organization');
    }

    // Create membership
    const membership = await this.prisma.orgMembership.create({
      data: {
        userId,
        orgId: org.id,
        approvedAt: new Date(),
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
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            level: true,
          },
        },
      },
    });

    // Update member count
    await this.prisma.organization.update({
      where: { id: org.id },
      data: { memberCount: { increment: 1 } },
    });

    return membership;
  }

  /**
   * Regenerate invite code (admin only)
   */
  async regenerateInviteCode(orgId: string, requesterId: string) {
    // Check if requester is admin of this organization
    const requesterMembership = await this.prisma.orgMembership.findUnique({
      where: {
        userId_orgId: {
          userId: requesterId,
          orgId,
        },
      },
    });

    if (!requesterMembership?.isAdmin) {
      throw new ConflictException('Only admins can regenerate invite codes');
    }

    const newCode = await this.generateInviteCode();

    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: { inviteCode: newCode },
    });

    return org;
  }

  /**
   * Check if user is admin of organization
   */
  async isUserAdmin(userId: string, orgId: string): Promise<boolean> {
    const membership = await this.prisma.orgMembership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    return membership?.isAdmin ?? false;
  }

  /**
   * Get organizations for the mobile selector component.
   * Returns user's orgs sorted by join date (newest first),
   * along with public org info and display flags.
   */
  async getOrganizationsForSelector(userId: string) {
    // Get user's organizations sorted by join date (newest first)
    const memberships = await this.prisma.orgMembership.findMany({
      where: {
        userId,
        isActive: true,
        organization: {
          isActive: true,
        },
      },
      include: {
        organization: {
          include: {
            state: true,
            lga: true,
            ward: true,
            pollingUnit: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const organizations = memberships.map((m) => ({
      ...m.organization,
      joinedAt: m.joinedAt,
    }));

    // Get platform settings for public org
    const settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'default' },
    });

    let publicOrg = null;
    if (settings?.publicOrgId) {
      publicOrg = await this.prisma.organization.findUnique({
        where: { id: settings.publicOrgId },
      });
    }

    // Filter out public org from regular organizations list
    const filteredOrganizations = organizations.filter(
      (org) => org.id !== settings?.publicOrgId,
    );

    // Show "All Organizations" only if user has 2+ orgs (excluding public)
    const showAllOrgsOption = filteredOrganizations.length >= 2;

    return {
      organizations: filteredOrganizations,
      publicOrg,
      publicOrgEnabled: settings?.publicOrgEnabled ?? false,
      showAllOrgsOption,
    };
  }

  /**
   * Get the Public organization
   */
  async getPublicOrganization() {
    const settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings?.publicOrgId || !settings?.publicOrgEnabled) {
      return null;
    }

    return this.prisma.organization.findUnique({
      where: { id: settings.publicOrgId },
    });
  }
}

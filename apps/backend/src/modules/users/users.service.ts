import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileInput } from './dto/update-profile.input';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        country: true,
        state: true,
        lga: true,
        ward: true,
        pollingUnit: true,
        followers: {
          include: {
            follower: {
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
        following: {
          include: {
            following: {
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
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      postCount: user._count.posts,
      followerCount: user._count.followers,
      followingCount: user._count.following,
    };
  }

  async searchUsers(query: string, limit: number = 20, offset: number = 0) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        displayName: true,
        email: true,
        avatar: true,
        phoneNumber: true,
        bio: true,
        isActive: true,
        isEmailVerified: true,
        isPlatformAdmin: true,
        isSuspended: true,
        createdAt: true,
      },
      take: limit,
      skip: offset,
      orderBy: { firstName: 'asc' },
    });
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    // Destructure location IDs from the rest of the input
    const { stateId, lgaId, wardId, countryId, pollingUnitId, ...updateData } = input;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        ...(countryId !== undefined && {
          country: countryId ? { connect: { id: countryId } } : { disconnect: true },
        }),
        ...(stateId !== undefined && {
          state: stateId ? { connect: { id: stateId } } : { disconnect: true },
        }),
        ...(lgaId !== undefined && {
          lga: lgaId ? { connect: { id: lgaId } } : { disconnect: true },
        }),
        ...(wardId !== undefined && {
          ward: wardId ? { connect: { id: wardId } } : { disconnect: true },
        }),
        ...(pollingUnitId !== undefined && {
          pollingUnit: pollingUnitId ? { connect: { id: pollingUnitId } } : { disconnect: true },
        }),
      },
      include: {
        country: true,
        state: true,
        lga: true,
        ward: true,
        pollingUnit: true,
      },
    });

    return user;
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new Error('Already following this user');
    }

    const follow = await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
      include: {
        following: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Create notification for followed user
    await this.prisma.notification.create({
      data: {
        userId: followingId,
        type: 'NEW_FOLLOWER',
        title: 'New Follower',
        message: 'Someone started following you',
        data: { followerId },
      },
    });

    return follow;
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return true;
  }

  async getFollowers(userId: string, limit: number = 20, offset: number = 0) {
    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
            bio: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return followers.map((f) => f.follower);
  }

  async getFollowing(userId: string, limit: number = 20, offset: number = 0) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
            bio: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return following.map((f) => f.following);
  }

  async getUserMemberships(userId: string) {
    const memberships = await this.prisma.orgMembership.findMany({
      where: { userId },
      include: {
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
      orderBy: { joinedAt: 'desc' },
    });

    return memberships;
  }
}

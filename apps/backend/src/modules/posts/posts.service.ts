import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostInput } from './dto/create-post.input';
import { FeedFilterInput } from './dto/feed-filter.input';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async getFeed(userId: string, limit: number = 20, offset: number = 0, filter?: FeedFilterInput) {
    // Get user's organizations
    const memberships = await this.prisma.orgMembership.findMany({
      where: { userId, isActive: true },
      select: { orgId: true },
    });

    const orgIds = memberships.map((m) => m.orgId);

    // Get posts from followed users and user's organizations
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // Build location filter for organizations
    const orgLocationFilter: any = {};
    if (filter?.stateId) {
      orgLocationFilter.stateId = filter.stateId;
    }
    if (filter?.lgaId) {
      orgLocationFilter.lgaId = filter.lgaId;
    }
    if (filter?.wardId) {
      orgLocationFilter.wardId = filter.wardId;
    }
    if (filter?.pollingUnitId) {
      orgLocationFilter.pollingUnitId = filter.pollingUnitId;
    }

    // Build where clause
    const whereClause: any = {
      isPublished: true,
      OR: [
        { authorId: { in: [...followingIds, userId] } },
        { orgId: { in: orgIds } },
      ],
    };

    // Apply location filter if provided
    if (Object.keys(orgLocationFilter).length > 0) {
      whereClause.organization = orgLocationFilter;
    }

    return this.prisma.post.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            stateId: true,
            lgaId: true,
            wardId: true,
            pollingUnitId: true,
          },
        },
        poll: {
          include: {
            options: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getPolls(userId: string, limit: number = 20, offset: number = 0, organizationId?: string) {
    // Get user's organizations
    const memberships = await this.prisma.orgMembership.findMany({
      where: { userId, isActive: true },
      select: { orgId: true },
    });

    const orgIds = memberships.map((m) => m.orgId);

    const whereClause: any = {
      type: 'POLL',
      isPublished: true,
    };

    // If organizationId is specified, filter by it
    if (organizationId) {
      whereClause.orgId = organizationId;
    } else {
      // Otherwise, show polls from user's organizations
      whereClause.orgId = { in: orgIds };
    }

    return this.prisma.post.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        poll: {
          include: {
            options: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        poll: {
          include: {
            options: {
              include: {
                _count: {
                  select: { votes: true },
                },
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Increment view count
    await this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return post;
  }

  async create(userId: string, input: CreatePostInput) {
    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        content: input.content,
        type: input.type as any,
        orgId: input.orgId,
        mediaUrls: input.mediaUrls || [],
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
        organization: true,
      },
    });

    // Create poll if provided
    if (input.poll && input.type === 'POLL') {
      await this.prisma.poll.create({
        data: {
          postId: post.id,
          question: input.poll.question,
          endsAt: input.poll.endsAt,
          allowMultiple: input.poll.allowMultipleVotes || false,
          options: {
            create: input.poll.options.map((opt: string) => ({
              text: opt,
            })),
          },
        },
      });
    }

    return post;
  }

  async delete(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return true;
  }

  async like(userId: string, postId: string) {
    // Check if already liked
    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      await this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      });

      return false;
    }

    // Like
    await this.prisma.like.create({
      data: {
        postId,
        userId,
      },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
    });

    // Create notification
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (post && post.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'POST_LIKE',
          title: 'New Like',
          message: 'Someone liked your post',
          data: { postId, likerId: userId },
        },
      });
    }

    return true;
  }

  async createComment(userId: string, postId: string, content: string, parentId?: string) {
    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content,
        parentId,
      },
      include: {
        author: {
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

    // Update comment count
    await this.prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    // Create notification
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (post && post.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'POST_COMMENT',
          title: 'New Comment',
          message: 'Someone commented on your post',
          data: { postId, commentId: comment.id, commenterId: userId },
        },
      });
    }

    return comment;
  }

  async castVote(userId: string, pollId: string, optionId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if poll has ended
    if (poll.endsAt && poll.endsAt < new Date()) {
      throw new ForbiddenException('Poll has ended');
    }

    // Check if already voted
    const existingVote = await this.prisma.pollVote.findUnique({
      where: {
        pollId_optionId_userId: {
          pollId,
          optionId,
          userId,
        },
      },
    });

    if (existingVote) {
      throw new ForbiddenException('Already voted for this option');
    }

    // If not allowing multiple votes, check if user has voted for any option
    if (!poll.allowMultiple) {
      const userVote = await this.prisma.pollVote.findFirst({
        where: { pollId, userId },
      });

      if (userVote) {
        throw new ForbiddenException('You have already voted in this poll');
      }
    }

    // Create vote
    await this.prisma.pollVote.create({
      data: {
        pollId,
        optionId,
        userId,
      },
    });

    // Update vote count
    await this.prisma.pollOption.update({
      where: { id: optionId },
      data: { voteCount: { increment: 1 } },
    });

    return true;
  }
}

import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostInput } from './dto/create-post.input';
import { FeedFilterInput } from './dto/feed-filter.input';

export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

export interface ShareResult {
  id: string;
  shareCount: number;
  platform: string;
}


@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(private prisma: PrismaService) {}

  async getFeed(userId: string, limit: number = 20, offset: number = 0, filter?: FeedFilterInput) {
    this.logger.log(`getFeed called with filter: ${JSON.stringify(filter)}`);

    try {
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

      // Build where clause
      const whereClause: any = {
        isPublished: true,
      };

      // Apply location filter directly on posts (posts have their own location)
      if (filter?.countryId) whereClause.countryId = filter.countryId;
      if (filter?.stateId) whereClause.stateId = filter.stateId;
      if (filter?.lgaId) whereClause.lgaId = filter.lgaId;
      if (filter?.wardId) whereClause.wardId = filter.wardId;
      if (filter?.pollingUnitId) whereClause.pollingUnitId = filter.pollingUnitId;

      // If filtering by specific organization, only show posts from that org
      if (filter?.orgId) {
        whereClause.orgId = filter.orgId;
      } else if (!filter?.countryId && !filter?.stateId && !filter?.lgaId && !filter?.wardId && !filter?.pollingUnitId) {
        // No location or org filters - show posts from followed users and user's organizations
        whereClause.OR = [
          { authorId: { in: [...followingIds, userId] } },
          { orgId: { in: orgIds } },
        ];
      }

      this.logger.log(`getFeed whereClause: ${JSON.stringify(whereClause)}`);

      const posts = await this.prisma.post.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
            email: true,
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
            votes: {
              where: { userId },
              select: { optionId: true },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get org IDs for posts that have organizations
    const postOrgIds = posts
      .filter((p) => p.orgId)
      .map((p) => ({ orgId: p.orgId!, authorId: p.authorId }));

    // Fetch membership info to get leader status
    const authorOrgPairs = [...new Set(postOrgIds.map(p => `${p.authorId}:${p.orgId}`))];
    const authorMemberships = await this.prisma.orgMembership.findMany({
      where: {
        OR: authorOrgPairs.map(pair => {
          const [uId, oId] = pair.split(':');
          return { userId: uId, orgId: oId };
        }),
        isActive: true,
      },
      select: {
        userId: true,
        orgId: true,
        isLeader: true,
        leaderLevel: true,
      },
    });

    // Create lookup map for memberships
    const membershipMap = new Map(
      authorMemberships.map(m => [`${m.userId}:${m.orgId}`, m])
    );

    // Transform to add hasVoted and userVotedOptionId to polls and isLiked to posts
    return posts.map((post) => {
      const result: any = { ...post };

      // Add isLiked field
      result.isLiked = (post as any).likes?.length > 0;
      delete result.likes; // Remove the likes array from response

      // Add leader info to author if post has organization
      if (post.orgId && result.author) {
        const membership = membershipMap.get(`${post.authorId}:${post.orgId}`);
        if (membership) {
          result.author = {
            ...result.author,
            isLeader: membership.isLeader,
            leaderLevel: membership.leaderLevel,
          };
        }
      }

      if (post.poll) {
        const userVotes = (post.poll as any).votes || [];
        const hasVoted = userVotes.length > 0;
        const userVotedOptionId = hasVoted ? userVotes[0].optionId : null;

        result.poll = {
          ...post.poll,
          hasVoted,
          userVotedOptionId,
          votes: undefined, // Remove the votes array from response
        };
      }
      return result;
    });
    } catch (error) {
      this.logger.error(`getFeed error: ${error.message}`, error.stack);
      throw error;
    }
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

  async findById(id: string, userId?: string) {
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
        likes: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
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

    // Add isLiked field if userId is provided
    const result: any = { ...post };
    if (userId) {
      result.isLiked = (post as any).likes?.length > 0;
      delete result.likes; // Remove the likes array from response
    }

    return result;
  }

  async create(userId: string, input: CreatePostInput) {
    // Get user's location to set on the post
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        countryId: true,
        stateId: true,
        lgaId: true,
        wardId: true,
        pollingUnitId: true,
      },
    });

    // Determine organization - use Public org if none specified
    let orgId = input.orgId;
    if (!orgId) {
      const settings = await this.prisma.platformSettings.findUnique({
        where: { id: 'default' },
      });
      if (settings?.publicOrgEnabled && settings?.publicOrgId) {
        orgId = settings.publicOrgId;
      }
    }

    // Build location data based on locationLevel if provided
    const locationData = this.buildLocationData(user, input.locationLevel);

    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        content: input.content,
        type: input.type as any,
        orgId,
        mediaUrls: input.mediaUrls || [],
        locationLevel: input.locationLevel,
        ...locationData,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
            username: true,
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

  /**
   * Like/Unlike a post with transaction to prevent race conditions.
   * Uses atomic increment/decrement for count updates.
   */
  async like(userId: string, postId: string): Promise<LikeResult> {
    return this.prisma.$transaction(async (tx) => {
      // Verify post exists
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { id: true, authorId: true },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Check if already liked (within transaction)
      const existingLike = await tx.like.findUnique({
        where: {
          postId_userId: { postId, userId },
        },
      });

      if (existingLike) {
        // Unlike - delete like and decrement count atomically
        await tx.like.delete({
          where: { postId_userId: { postId, userId } },
        });

        const updatedPost = await tx.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        });

        return { liked: false, likeCount: Math.max(0, updatedPost.likeCount) };
      }

      // Like - create like and increment count atomically
      await tx.like.create({
        data: { postId, userId },
      });

      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });

      // Create notification (still within transaction for consistency)
      if (post.authorId !== userId) {
        await tx.notification.create({
          data: {
            userId: post.authorId,
            type: 'POST_LIKE',
            title: 'New Like',
            message: 'Someone liked your post',
            data: { postId, likerId: userId },
          },
        });
      }

      return { liked: true, likeCount: updatedPost.likeCount };
    });
  }

  /**
   * Create a comment with transaction to prevent race conditions.
   * Handles both top-level comments and replies (nested comments).
   */
  async createComment(userId: string, postId: string, content: string, parentId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Verify post exists
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { id: true, authorId: true },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // If parentId is provided, verify parent comment exists
      if (parentId) {
        const parentComment = await tx.comment.findUnique({
          where: { id: parentId },
          select: { id: true, authorId: true, postId: true },
        });

        if (!parentComment) {
          throw new NotFoundException('Parent comment not found');
        }

        if (parentComment.postId !== postId) {
          throw new ForbiddenException('Parent comment does not belong to this post');
        }
      }

      // Create the comment
      const comment = await tx.comment.create({
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

      // Update post comment count
      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      // If this is a reply, update parent's reply count
      if (parentId) {
        await tx.comment.update({
          where: { id: parentId },
          data: { replyCount: { increment: 1 } },
        });

        // Get parent comment author for notification
        const parentComment = await tx.comment.findUnique({
          where: { id: parentId },
          select: { authorId: true },
        });

        // Notify parent comment author (if different from replier)
        if (parentComment && parentComment.authorId !== userId) {
          await tx.notification.create({
            data: {
              userId: parentComment.authorId,
              type: 'POST_COMMENT',
              title: 'New Reply',
              message: 'Someone replied to your comment',
              data: { postId, commentId: comment.id, parentId, replierId: userId },
            },
          });
        }
      }

      // Notify post author (if different from commenter)
      if (post.authorId !== userId) {
        await tx.notification.create({
          data: {
            userId: post.authorId,
            type: 'POST_COMMENT',
            title: parentId ? 'New Reply on Your Post' : 'New Comment',
            message: parentId ? 'Someone replied on your post' : 'Someone commented on your post',
            data: { postId, commentId: comment.id, commenterId: userId },
          },
        });
      }

      return comment;
    });
  }

  async castVote(userId: string, pollId: string, optionId: string) {
    // Use an interactive transaction to prevent race conditions
    return this.prisma.$transaction(async (tx) => {
      const poll = await tx.poll.findUnique({
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

      // Validate that optionId belongs to this poll
      const validOption = poll.options.find((opt) => opt.id === optionId);
      if (!validOption) {
        throw new NotFoundException('Poll option not found');
      }

      // Check if user has already voted in this poll (for single-vote polls)
      // This check happens atomically within the transaction
      const existingVote = await tx.pollVote.findFirst({
        where: { pollId, userId },
      });

      if (existingVote) {
        if (!poll.allowMultiple) {
          throw new ForbiddenException('You have already voted in this poll');
        }
        // For multi-vote polls, check if already voted for this specific option
        if (existingVote.optionId === optionId) {
          throw new ForbiddenException('Already voted for this option');
        }
      }

      // For multi-vote polls, also check this specific option
      if (poll.allowMultiple) {
        const existingOptionVote = await tx.pollVote.findUnique({
          where: {
            pollId_optionId_userId: {
              pollId,
              optionId,
              userId,
            },
          },
        });

        if (existingOptionVote) {
          throw new ForbiddenException('Already voted for this option');
        }
      }

      // Create vote within the transaction
      await tx.pollVote.create({
        data: {
          pollId,
          optionId,
          userId,
        },
      });

      // Update vote count within the transaction
      await tx.pollOption.update({
        where: { id: optionId },
        data: { voteCount: { increment: 1 } },
      });

      return true;
    }, {
      // Use serializable isolation to prevent race conditions
      isolationLevel: 'Serializable',
    });
  }

  /**
   * Like/Unlike a comment with transaction to prevent race conditions.
   */
  async likeComment(userId: string, commentId: string): Promise<LikeResult> {
    return this.prisma.$transaction(async (tx) => {
      // Verify comment exists and is not deleted
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: { id: true, authorId: true, isDeleted: true },
      });

      if (!comment || comment.isDeleted) {
        throw new NotFoundException('Comment not found');
      }

      // Check if already liked
      const existingLike = await tx.commentLike.findUnique({
        where: {
          commentId_userId: { commentId, userId },
        },
      });

      if (existingLike) {
        // Unlike
        await tx.commentLike.delete({
          where: { commentId_userId: { commentId, userId } },
        });

        const updatedComment = await tx.comment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        });

        return { liked: false, likeCount: Math.max(0, updatedComment.likeCount) };
      }

      // Like
      await tx.commentLike.create({
        data: { commentId, userId },
      });

      const updatedComment = await tx.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });

      return { liked: true, likeCount: updatedComment.likeCount };
    });
  }

  /**
   * Soft delete a comment with transaction.
   */
  async deleteComment(userId: string, commentId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: { id: true, authorId: true, postId: true, parentId: true, isDeleted: true },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      if (comment.isDeleted) {
        throw new ForbiddenException('Comment already deleted');
      }

      if (comment.authorId !== userId) {
        throw new ForbiddenException('You can only delete your own comments');
      }

      // Soft delete the comment
      await tx.comment.update({
        where: { id: commentId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          content: '[deleted]',
        },
      });

      // Decrement post comment count
      await tx.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      });

      // If this was a reply, decrement parent's reply count
      if (comment.parentId) {
        await tx.comment.update({
          where: { id: comment.parentId },
          data: { replyCount: { decrement: 1 } },
        });
      }

      return true;
    });
  }

  /**
   * Update a comment's content.
   */
  async updateComment(userId: string, commentId: string, content: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, isDeleted: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.isDeleted) {
      throw new ForbiddenException('Cannot edit a deleted comment');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
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
  }

  /**
   * Share a post with transaction.
   * Allows multiple shares (e.g., to different platforms).
   */
  async sharePost(userId: string, postId: string, platform: string = 'internal'): Promise<ShareResult> {
    return this.prisma.$transaction(async (tx) => {
      // Verify post exists
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { id: true, isPublished: true },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (!post.isPublished) {
        throw new ForbiddenException('Cannot share an unpublished post');
      }

      // Create share record
      const share = await tx.share.create({
        data: {
          postId,
          userId,
          platform,
        },
      });

      // Increment share count
      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: { shareCount: { increment: 1 } },
        select: { shareCount: true },
      });

      return {
        id: share.id,
        shareCount: updatedPost.shareCount,
        platform: share.platform,
      };
    });
  }

  /**
   * Get comments for a post with pagination.
   * Only returns top-level comments (no parentId).
   * Replies are fetched separately or nested.
   */
  async getComments(postId: string, userId?: string, limit: number = 20, offset: number = 0) {
    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // Only top-level comments
        isDeleted: false,
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
        replies: {
          where: { isDeleted: false },
          take: 3, // Only fetch first 3 replies
          orderBy: { createdAt: 'asc' },
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
            likes: userId ? {
              where: { userId },
              select: { id: true },
            } : false,
          },
        },
        likes: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
        _count: {
          select: {
            replies: { where: { isDeleted: false } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Transform to add isLiked field
    return comments.map((comment) => {
      const isLiked = userId && (comment as any).likes?.length > 0;
      const replies = (comment as any).replies?.map((reply: any) => ({
        ...reply,
        isLiked: userId && reply.likes?.length > 0,
        likes: undefined,
      }));

      return {
        ...comment,
        isLiked,
        replies,
        totalReplies: (comment as any)._count?.replies || 0,
        likes: undefined,
        _count: undefined,
      };
    });
  }

  /**
   * Get replies for a comment with pagination.
   */
  async getReplies(commentId: string, userId?: string, limit: number = 20, offset: number = 0) {
    const replies = await this.prisma.comment.findMany({
      where: {
        parentId: commentId,
        isDeleted: false,
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
        likes: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    return replies.map((reply) => ({
      ...reply,
      isLiked: userId && (reply as any).likes?.length > 0,
      likes: undefined,
    }));
  }

  /**
   * Check if user has liked a post.
   */
  async hasLikedPost(userId: string, postId: string): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });
    return !!like;
  }

  /**
   * Generate share text for a post with location context.
   *
   * Format:
   * "{content}"
   * -- {authorName} in {STATE} > {LGA} > {Ward} ward > {PollingUnit} polling unit.
   *
   * Join the conversation (code: {inviteCode}) in your location.
   *
   * Download the Mobiliser app today, on iPhone or Android.
   * {appDownloadLink}
   *
   * @param postId - The post ID
   * @param includeMarketing - Whether to include app download/invite code text (for external shares)
   */
  async getShareText(postId: string, includeMarketing: boolean = true): Promise<string> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
          },
        },
        organization: {
          select: {
            inviteCode: true,
          },
        },
        state: {
          select: { name: true },
        },
        lga: {
          select: { name: true },
        },
        ward: {
          select: { name: true },
        },
        pollingUnit: {
          select: { name: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Build author name
    const authorName = post.author.displayName ||
      `${post.author.firstName} ${post.author.lastName}`.trim();

    // Truncate content if too long (first ~200 chars for share)
    let contentPreview = post.content;
    if (contentPreview.length > 200) {
      contentPreview = contentPreview.substring(0, 200).trim() + '...';
    }

    // Build location string
    // Format: STATE > LGA > Ward ward > PollingUnit polling unit
    const locationString = this.buildLocationString(
      (post as any).state?.name,
      (post as any).lga?.name,
      (post as any).ward?.name,
      (post as any).pollingUnit?.name,
    );

    // Build invite code line
    const inviteText = post.organization?.inviteCode
      ? `Join the conversation (code: ${post.organization.inviteCode}) in your location.`
      : 'Join the conversation in your location.';

    // Build the share text as a single formatted string
    // URL is inline with CTA to prevent WhatsApp from extracting just the URL
    const shareText = includeMarketing
      ? `"${contentPreview}"
-- ${authorName}${locationString}.

${inviteText}

Download the Mobiliser app today, on iPhone or Android: https://mobiliser.app/download`
      : `"${contentPreview}"
-- ${authorName}${locationString}.`;

    return shareText;
  }

  /**
   * Build location string with level types for each part.
   * Format: STATE > LGA > Ward ward > PollingUnit polling unit
   * Each level includes its type suffix.
   */
  private buildLocationString(
    stateName?: string,
    lgaName?: string,
    wardName?: string,
    pollingUnitName?: string,
  ): string {
    const parts: string[] = [];

    // Add each level with its type
    if (stateName) {
      parts.push(stateName.toUpperCase());
    }
    if (lgaName) {
      parts.push(lgaName);
    }
    if (wardName) {
      parts.push(`${wardName} ward`);
    }
    if (pollingUnitName) {
      parts.push(`${pollingUnitName} polling unit`);
    }

    if (parts.length === 0) return '';

    // Join with " > "
    return ` in ${parts.join(' > ')}`;
  }

  /**
   * Build location data based on the user's location and selected level.
   * IMPORTANT: Only sets the EXACT location level selected to prevent cascade.
   * Posts should only appear at their exact selected level, not at higher levels.
   */
  private buildLocationData(
    user: { countryId: string | null; stateId: string | null; lgaId: string | null; wardId: string | null; pollingUnitId: string | null } | null,
    locationLevel?: string,
  ): { countryId?: string; stateId?: string; lgaId?: string; wardId?: string; pollingUnitId?: string } {
    if (!user) return {};

    // If no location level specified, default to polling unit level (most specific)
    if (!locationLevel) {
      if (user.pollingUnitId) {
        return { pollingUnitId: user.pollingUnitId };
      } else if (user.wardId) {
        return { wardId: user.wardId };
      } else if (user.lgaId) {
        return { lgaId: user.lgaId };
      } else if (user.stateId) {
        return { stateId: user.stateId };
      } else if (user.countryId) {
        return { countryId: user.countryId };
      }
      return {};
    }

    // ONLY set the specific location level selected - NO cascade
    switch (locationLevel) {
      case 'COUNTRY':
        return {
          countryId: user.countryId || undefined,
        };
      case 'STATE':
        return {
          stateId: user.stateId || undefined,
        };
      case 'LGA':
        return {
          lgaId: user.lgaId || undefined,
        };
      case 'WARD':
        return {
          wardId: user.wardId || undefined,
        };
      case 'POLLING_UNIT':
        return {
          pollingUnitId: user.pollingUnitId || undefined,
        };
      default:
        // Default to most specific level available
        if (user.pollingUnitId) {
          return { pollingUnitId: user.pollingUnitId };
        } else if (user.wardId) {
          return { wardId: user.wardId };
        } else if (user.lgaId) {
          return { lgaId: user.lgaId };
        } else if (user.stateId) {
          return { stateId: user.stateId };
        } else if (user.countryId) {
          return { countryId: user.countryId };
        }
        return {};
    }
  }
}

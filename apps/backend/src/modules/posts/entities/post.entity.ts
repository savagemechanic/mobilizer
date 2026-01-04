import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { PostType } from '@prisma/client';
import { UserSummary } from '../../../common/entities/user-summary.entity';

registerEnumType(PostType, {
  name: 'PostType',
  description: 'Type of post',
});

export { UserSummary };

@ObjectType()
export class OrganizationSummary {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  logo?: string;
}

@ObjectType()
export class PollOptionEntity {
  @Field(() => ID)
  id: string;

  @Field()
  pollId: string;

  @Field()
  text: string;

  @Field()
  voteCount: number;
}

@ObjectType()
export class PollEntity {
  @Field(() => ID)
  id: string;

  @Field()
  postId: string;

  @Field()
  question: string;

  @Field({ nullable: true })
  endsAt?: Date;

  @Field()
  allowMultiple: boolean;

  @Field()
  createdAt: Date;

  @Field(() => [PollOptionEntity], { nullable: true })
  options?: PollOptionEntity[];

  @Field({ nullable: true, description: 'Whether the current user has voted in this poll' })
  hasVoted?: boolean;

  @Field({ nullable: true, description: 'The option ID the current user voted for (if single-vote poll)' })
  userVotedOptionId?: string;
}

@ObjectType()
export class PostEntity {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field(() => PostType)
  type: PostType;

  @Field()
  authorId: string;

  @Field({ nullable: true })
  orgId?: string;

  @Field(() => [String], { nullable: true })
  mediaUrls?: string[];

  @Field()
  likeCount: number;

  @Field()
  commentCount: number;

  @Field()
  shareCount: number;

  @Field()
  repostCount: number;

  @Field()
  viewCount: number;

  @Field()
  isPublished: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => UserSummary, { nullable: true })
  author?: UserSummary;

  @Field(() => OrganizationSummary, { nullable: true })
  organization?: OrganizationSummary;

  @Field(() => PollEntity, { nullable: true })
  poll?: PollEntity;

  @Field({ nullable: true, description: 'Whether the current user has liked this post' })
  isLiked?: boolean;

  @Field(() => [CommentEntity], { nullable: true })
  comments?: CommentEntity[];
}

@ObjectType()
export class CommentEntity {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  authorId: string;

  @Field()
  postId: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field()
  likeCount: number;

  @Field()
  replyCount: number;

  @Field()
  isDeleted: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => UserSummary, { nullable: true })
  author?: UserSummary;

  @Field({ nullable: true, description: 'Whether the current user has liked this comment' })
  isLiked?: boolean;

  @Field(() => [CommentEntity], { nullable: true, description: 'First few replies to this comment' })
  replies?: CommentEntity[];

  @Field({ nullable: true, description: 'Total number of replies to this comment' })
  totalReplies?: number;
}

@ObjectType()
export class LikeResultEntity {
  @Field({ description: 'Whether the post/comment is now liked' })
  liked: boolean;

  @Field({ description: 'Updated like count' })
  likeCount: number;
}

@ObjectType()
export class ShareResultEntity {
  @Field(() => ID)
  id: string;

  @Field({ description: 'Updated share count' })
  shareCount: number;

  @Field({ description: 'Platform the post was shared to' })
  platform: string;
}


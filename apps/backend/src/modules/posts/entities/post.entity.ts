import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { PostType } from '@prisma/client';

registerEnumType(PostType, {
  name: 'PostType',
  description: 'Type of post',
});

@ObjectType()
export class UserSummary {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatar?: string;
}

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
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => UserSummary, { nullable: true })
  author?: UserSummary;
}

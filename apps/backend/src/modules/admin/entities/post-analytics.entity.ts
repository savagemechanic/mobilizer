import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class PostTypeBreakdown {
  @Field()
  type: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class PostAnalytics {
  @Field(() => Int)
  totalPosts: number;

  @Field(() => Int)
  totalLikes: number;

  @Field(() => Int)
  totalComments: number;

  @Field(() => Int)
  totalShares: number;

  @Field(() => Int)
  totalPolls: number;

  @Field(() => [PostTypeBreakdown])
  postsByType: PostTypeBreakdown[];

  @Field(() => Int)
  averageLikesPerPost: number;

  @Field(() => Int)
  averageCommentsPerPost: number;
}

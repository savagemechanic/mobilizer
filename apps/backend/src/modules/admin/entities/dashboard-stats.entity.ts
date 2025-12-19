import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class LevelDistribution {
  @Field()
  level: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class DashboardStats {
  @Field(() => Int)
  totalMembers: number;

  @Field(() => Int)
  totalSupportGroups: number;

  @Field(() => Int)
  totalPosts: number;

  @Field(() => Int)
  totalEvents: number;

  @Field(() => Int)
  activeMembers: number;

  @Field(() => Int)
  newMembersThisMonth: number;

  @Field(() => [LevelDistribution])
  levelDistribution: LevelDistribution[];
}

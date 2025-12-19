import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class MovementSummary {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field(() => Int)
  supportGroupsCount: number;

  @Field(() => Int)
  membersCount: number;
}

@ObjectType()
export class PlatformStats {
  @Field(() => Int)
  totalMovements: number;

  @Field(() => Int)
  totalSupportGroups: number;

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  totalPosts: number;

  @Field(() => Int)
  totalEvents: number;

  @Field(() => Int)
  activeUsersToday: number;

  @Field(() => Int)
  newUsersThisWeek: number;

  @Field(() => [MovementSummary])
  movementSummaries: MovementSummary[];
}

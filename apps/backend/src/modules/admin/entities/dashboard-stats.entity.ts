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

  // Coverage Statistics
  @Field(() => Int)
  countriesCovered: number;

  @Field(() => Int)
  statesCovered: number;

  @Field(() => Int)
  lgasCovered: number;

  @Field(() => Int)
  wardsCovered: number;

  @Field(() => Int)
  pollingUnitsCovered: number;

  @Field(() => Int)
  totalStates: number;

  @Field(() => Int)
  totalLgas: number;

  @Field(() => Int)
  totalWards: number;

  @Field(() => Int)
  totalPollingUnits: number;
}

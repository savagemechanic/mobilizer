import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class MembersByLevel {
  @Field(() => Int)
  national: number;

  @Field(() => Int)
  state: number;

  @Field(() => Int)
  lga: number;

  @Field(() => Int)
  ward: number;
}

@ObjectType()
export class RecentActivity {
  @Field()
  date: Date;

  @Field()
  type: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  entityId?: string;
}

@ObjectType()
export class MovementStats {
  @Field(() => Int)
  totalSupportGroups: number;

  @Field(() => Int)
  totalMembers: number;

  @Field(() => Int)
  totalPosts: number;

  @Field(() => Int)
  totalEvents: number;

  @Field(() => MembersByLevel)
  membersByLevel: MembersByLevel;

  @Field(() => [RecentActivity], { nullable: true })
  recentActivity?: RecentActivity[];
}

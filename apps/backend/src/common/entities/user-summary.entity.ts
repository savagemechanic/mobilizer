import { ObjectType, Field, ID } from '@nestjs/graphql';
import { LeaderLevel } from '@prisma/client';

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

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true, description: 'Whether the user is a leader in the context organization' })
  isLeader?: boolean;

  @Field(() => String, { nullable: true, description: 'Leadership level if the user is a leader' })
  leaderLevel?: LeaderLevel;
}

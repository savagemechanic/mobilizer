import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class MovementAdminUser {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatar?: string;
}

@ObjectType()
export class Movement {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logo?: string;

  @Field({ nullable: true })
  banner?: string;

  @Field({ nullable: true })
  website?: string;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  createdById?: string;

  // Resolved fields
  @Field(() => Number, { nullable: true })
  supportGroupsCount?: number;

  @Field(() => Number, { nullable: true })
  membersCount?: number;

  @Field(() => [MovementAdminUser], { nullable: true })
  superAdmins?: MovementAdminUser[];
}

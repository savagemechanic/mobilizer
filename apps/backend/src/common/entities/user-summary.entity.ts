import { ObjectType, Field, ID } from '@nestjs/graphql';

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

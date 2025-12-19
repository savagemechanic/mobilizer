import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class SupportGroupInfo {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}

@ObjectType()
export class RoleInfo {
  @Field(() => ID)
  role_id: string;

  @Field()
  role_name: string;

  @Field(() => [SupportGroupInfo], { nullable: true })
  support_groups?: SupportGroupInfo[];
}

@ObjectType()
export class UserRolesResponse {
  @Field(() => ID)
  movement_id: string;

  @Field()
  movement_name: string;

  @Field(() => [RoleInfo])
  roles: RoleInfo[];
}

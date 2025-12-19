import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '../../auth/dto/auth-payload';

@ObjectType()
export class PaginatedUsersResponse {
  @Field(() => [User])
  items: User[];

  @Field(() => Int)
  totalCount: number;

  @Field()
  hasMore: boolean;
}

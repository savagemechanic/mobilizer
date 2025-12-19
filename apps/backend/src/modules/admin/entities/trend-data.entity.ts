import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class TrendPoint {
  @Field()
  date: string;

  @Field(() => Int)
  count: number;
}

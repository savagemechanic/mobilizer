import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class WordCloudItem {
  @Field()
  word: string;

  @Field(() => Int)
  count: number;
}

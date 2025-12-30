import { Field, InputType } from '@nestjs/graphql';

@InputType('FeedFilterInput')
export class FeedFilterInput {
  @Field({ nullable: true })
  orgId?: string;

  @Field({ nullable: true })
  stateId?: string;

  @Field({ nullable: true })
  lgaId?: string;

  @Field({ nullable: true })
  wardId?: string;

  @Field({ nullable: true })
  pollingUnitId?: string;
}

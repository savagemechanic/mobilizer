import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class DateRangeInput {
  @Field()
  startDate: Date;

  @Field()
  endDate: Date;
}

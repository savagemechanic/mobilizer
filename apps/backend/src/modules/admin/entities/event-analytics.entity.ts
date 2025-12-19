import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class EventTypeBreakdown {
  @Field()
  type: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class EventAnalytics {
  @Field(() => Int)
  totalEvents: number;

  @Field(() => Int)
  upcomingEvents: number;

  @Field(() => Int)
  pastEvents: number;

  @Field(() => Int)
  totalRSVPs: number;

  @Field(() => [EventTypeBreakdown])
  eventsByType: EventTypeBreakdown[];

  @Field(() => Int)
  averageRSVPsPerEvent: number;
}

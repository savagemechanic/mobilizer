import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { EventType } from '@prisma/client';

registerEnumType(EventType, {
  name: 'EventType',
  description: 'Type of event',
});

@ObjectType()
export class EventEntity {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => EventType)
  type: EventType;

  @Field()
  startTime: Date;

  @Field({ nullable: true })
  endTime?: Date;

  @Field({ nullable: true })
  location?: string;

  @Field()
  isVirtual: boolean;

  @Field({ nullable: true })
  virtualLink?: string;

  @Field({ nullable: true })
  banner?: string;

  @Field()
  creatorId: string;

  @Field({ nullable: true })
  orgId?: string;

  @Field()
  isPublished: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@ObjectType()
export class EventRSVPEntity {
  @Field(() => ID)
  id: string;

  @Field()
  eventId: string;

  @Field()
  userId: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;
}

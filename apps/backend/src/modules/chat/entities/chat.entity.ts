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

@ObjectType()
export class MessageEntity {
  @Field(() => ID)
  id: string;

  @Field()
  conversationId: string;

  @Field()
  senderId: string;

  @Field({ nullable: true })
  sender?: UserSummary;

  @Field()
  content: string;

  @Field({ nullable: true })
  mediaUrl?: string;

  @Field()
  isRead: boolean;

  @Field({ nullable: true })
  readAt?: Date;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ConversationParticipantEntity {
  @Field(() => ID)
  id: string;

  @Field()
  conversationId: string;

  @Field()
  userId: string;

  @Field({ nullable: true })
  user?: UserSummary;

  @Field()
  joinedAt: Date;

  @Field({ nullable: true })
  leftAt?: Date;
}

@ObjectType()
export class ConversationEntity {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  isGroup: boolean;

  @Field()
  creatorId: string;

  @Field(() => [ConversationParticipantEntity], { nullable: true })
  participants?: ConversationParticipantEntity[];

  @Field(() => [MessageEntity], { nullable: true })
  messages?: MessageEntity[];

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

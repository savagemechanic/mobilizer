import { ObjectType, Field, ID } from '@nestjs/graphql';

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

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@ObjectType()
export class MessageEntity {
  @Field(() => ID)
  id: string;

  @Field()
  conversationId: string;

  @Field()
  senderId: string;

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

  @Field()
  joinedAt: Date;

  @Field({ nullable: true })
  leftAt?: Date;
}

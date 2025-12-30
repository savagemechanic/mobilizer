import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserSummary } from '../../../common/entities/user-summary.entity';

export { UserSummary };

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

import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageInput } from './dto/send-message.input';
import { ConversationEntity, MessageEntity } from './entities/chat.entity';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver()
export class ChatResolver {
  constructor(private chatService: ChatService) {}

  @Query(() => [ConversationEntity])
  @UseGuards(GqlAuthGuard)
  async conversations(@CurrentUser() user: any) {
    return this.chatService.getConversations(user.id);
  }

  @Query(() => [MessageEntity])
  @UseGuards(GqlAuthGuard)
  async messages(
    @CurrentUser() user: any,
    @Args('conversationId') conversationId: string,
    @Args('limit', { nullable: true, defaultValue: 50 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
  ) {
    return this.chatService.getMessages(user.id, conversationId, limit, offset);
  }

  @Mutation(() => ConversationEntity)
  @UseGuards(GqlAuthGuard)
  async createConversation(
    @CurrentUser() user: any,
    @Args('participantIds', { type: () => [String] }) participantIds: string[],
    @Args('name', { nullable: true }) name?: string,
  ) {
    return this.chatService.createConversation(user.id, participantIds, name);
  }

  @Mutation(() => MessageEntity)
  @UseGuards(GqlAuthGuard)
  async sendMessage(
    @CurrentUser() user: any,
    @Args('input') input: SendMessageInput,
  ) {
    return this.chatService.sendMessage(user.id, input);
  }

  @Mutation(() => MessageEntity)
  @UseGuards(GqlAuthGuard)
  async markAsRead(
    @CurrentUser() user: any,
    @Args('messageId') messageId: string,
  ) {
    return this.chatService.markAsRead(user.id, messageId);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async markConversationAsRead(
    @CurrentUser() user: any,
    @Args('conversationId') conversationId: string,
  ) {
    return this.chatService.markConversationAsRead(user.id, conversationId);
  }
}

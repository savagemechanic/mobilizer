import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageInput } from './dto/send-message.input';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations;
  }

  async getMessages(userId: string, conversationId: string, limit: number = 50, offset: number = 0) {
    // Check if user is a participant
    const participant = await this.prisma.participant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async createConversation(userId: string, participantIds: string[], name?: string) {
    // Create conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        type: participantIds.length > 1 ? 'GROUP' : 'DIRECT',
        name,
        participants: {
          create: [
            { userId },
            ...participantIds.map((id) => ({ userId: id })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return conversation;
  }

  async sendMessage(userId: string, input: SendMessageInput) {
    // Check if user is a participant
    const participant = await this.prisma.participant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: input.conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: userId,
        type: input.type as any,
        content: input.content,
        mediaUrl: input.mediaUrl,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    });

    // Create notifications for other participants
    const otherParticipants = await this.prisma.participant.findMany({
      where: {
        conversationId: input.conversationId,
        userId: { not: userId },
        leftAt: null,
      },
    });

    for (const participant of otherParticipants) {
      await this.prisma.notification.create({
        data: {
          userId: participant.userId,
          type: 'MESSAGE_RECEIVED',
          title: 'New Message',
          message: 'You have a new message',
          data: { conversationId: input.conversationId, messageId: message.id },
        },
      });
    }

    return message;
  }

  async markAsRead(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is a participant
    const participant = await this.prisma.participant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: message.conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Create or update read receipt
    const receipt = await this.prisma.readReceipt.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      create: {
        messageId,
        userId,
      },
      update: {
        readAt: new Date(),
      },
    });

    // Update participant's last read time
    await this.prisma.participant.update({
      where: {
        conversationId_userId: {
          conversationId: message.conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return receipt;
  }

  async markConversationAsRead(userId: string, conversationId: string) {
    // Get all unread messages
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readReceipts: {
          none: {
            userId,
          },
        },
      },
    });

    // Create read receipts for all unread messages
    for (const message of messages) {
      await this.prisma.readReceipt.create({
        data: {
          messageId: message.id,
          userId,
        },
      });
    }

    // Update participant's last read time
    await this.prisma.participant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return true;
  }
}

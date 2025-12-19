import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [ChatService, ChatResolver, PrismaService],
  exports: [ChatService],
})
export class ChatModule {}

import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsResolver } from './events.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [EventsService, EventsResolver, PrismaService],
  exports: [EventsService],
})
export class EventsModule {}

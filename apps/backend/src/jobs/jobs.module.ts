import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DailySummaryService } from './daily-summary.service';
import { EventReminderService } from './event-reminder.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [DailySummaryService, EventReminderService, PrismaService],
  exports: [DailySummaryService, EventReminderService],
})
export class JobsModule {}

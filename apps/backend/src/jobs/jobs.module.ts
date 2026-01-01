import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DailySummaryService } from './daily-summary.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [DailySummaryService, PrismaService],
  exports: [DailySummaryService],
})
export class JobsModule {}

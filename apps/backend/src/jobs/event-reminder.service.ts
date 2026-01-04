import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationsService } from '../modules/push-notifications/push-notifications.service';

@Injectable()
export class EventReminderService {
  private readonly logger = new Logger(EventReminderService.name);

  constructor(
    private prisma: PrismaService,
    private pushNotificationsService: PushNotificationsService,
  ) {}

  // Run every hour to check for upcoming events
  @Cron('0 * * * *', {
    name: 'event-reminder-hourly',
    timeZone: 'Africa/Lagos',
  })
  async sendEventReminders() {
    this.logger.log('Checking for upcoming events...');

    try {
      // Get events starting in the next hour
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      // Find events starting in 1-2 hours that haven't had reminders sent
      const upcomingEvents = await this.prisma.event.findMany({
        where: {
          startTime: {
            gte: oneHourFromNow,
            lt: twoHoursFromNow,
          },
          isPublished: true,
        },
        include: {
          rsvps: {
            where: { status: 'GOING' },
            select: { userId: true },
          },
          organization: {
            select: { name: true },
          },
        },
      });

      this.logger.log(`Found ${upcomingEvents.length} events starting soon`);

      for (const event of upcomingEvents) {
        const attendeeIds = event.rsvps.map((r) => r.userId);

        if (attendeeIds.length === 0) continue;

        const title = 'Event Starting Soon';
        const body = `${event.title} starts in about 1 hour${event.organization ? ` - ${event.organization.name}` : ''}`;

        const result = await this.pushNotificationsService.sendToUsers(
          attendeeIds,
          title,
          body,
          {
            type: 'event-reminder',
            eventId: event.id,
            screen: '/event',
          },
        );

        this.logger.log(
          `Event "${event.title}": sent ${result.sent} reminders, ${result.failed} failed`,
        );
      }
    } catch (error) {
      this.logger.error(`Event reminder job failed: ${error.message}`, error.stack);
    }
  }

  // Run daily at 8 AM to remind about events happening today
  @Cron('0 8 * * *', {
    name: 'daily-event-reminder',
    timeZone: 'Africa/Lagos',
  })
  async sendDailyEventReminders() {
    this.logger.log('Sending daily event reminders...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find all events happening today
      const todayEvents = await this.prisma.event.findMany({
        where: {
          startTime: {
            gte: today,
            lt: tomorrow,
          },
          isPublished: true,
        },
        include: {
          rsvps: {
            where: { status: 'GOING' },
            select: { userId: true },
          },
        },
      });

      this.logger.log(`Found ${todayEvents.length} events happening today`);

      for (const event of todayEvents) {
        const attendeeIds = event.rsvps.map((r) => r.userId);

        if (attendeeIds.length === 0) continue;

        const startTime = new Date(event.startTime);
        const timeStr = startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        const title = 'Event Today';
        const body = `${event.title} is happening today at ${timeStr}`;

        await this.pushNotificationsService.sendToUsers(attendeeIds, title, body, {
          type: 'event-reminder',
          eventId: event.id,
          screen: '/event',
        });
      }

      this.logger.log('Daily event reminders sent successfully');
    } catch (error) {
      this.logger.error(`Daily event reminder job failed: ${error.message}`, error.stack);
    }
  }
}

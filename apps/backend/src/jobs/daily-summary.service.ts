import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationsService } from '../modules/push-notifications/push-notifications.service';

interface UserSummary {
  userId: string;
  firstName: string;
  newPostsCount: number;
  newEventsCount: number;
  newMessagesCount: number;
  topOrganizations: string[];
}

@Injectable()
export class DailySummaryService {
  private readonly logger = new Logger(DailySummaryService.name);

  constructor(
    private prisma: PrismaService,
    private pushNotificationsService: PushNotificationsService,
  ) {}

  // Run every day at 9 AM local time
  @Cron('0 9 * * *', {
    name: 'daily-summary',
    timeZone: 'Africa/Lagos', // Nigerian timezone
  })
  async sendDailySummaries() {
    this.logger.log('Starting daily summary job...');

    try {
      // Get all active users with device tokens
      const usersWithDevices = await this.prisma.user.findMany({
        where: {
          isActive: true,
          deviceTokens: {
            some: {
              isActive: true,
            },
          },
        },
        select: {
          id: true,
          firstName: true,
        },
      });

      this.logger.log(`Found ${usersWithDevices.length} users with active devices`);

      let sent = 0;
      let failed = 0;

      // Process users in batches of 50
      const batchSize = 50;
      for (let i = 0; i < usersWithDevices.length; i += batchSize) {
        const batch = usersWithDevices.slice(i, i + batchSize);
        const promises = batch.map((user) =>
          this.sendUserSummary(user.id, user.firstName),
        );

        const results = await Promise.allSettled(promises);
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            sent++;
          } else {
            failed++;
          }
        });
      }

      this.logger.log(`Daily summary complete: ${sent} sent, ${failed} failed`);
    } catch (error) {
      this.logger.error(`Daily summary job failed: ${error.message}`, error.stack);
    }
  }

  private async sendUserSummary(userId: string, firstName: string): Promise<boolean> {
    try {
      const summary = await this.getUserActivity(userId);

      // Skip if no activity
      if (
        summary.newPostsCount === 0 &&
        summary.newEventsCount === 0 &&
        summary.newMessagesCount === 0
      ) {
        return false;
      }

      const { title, body } = this.formatSummaryMessage(firstName, summary);

      await this.pushNotificationsService.sendToUser(userId, title, body, {
        type: 'daily-summary',
        screen: '/(tabs)',
      });

      return true;
    } catch (error) {
      this.logger.warn(`Failed to send summary to user ${userId}: ${error.message}`);
      return false;
    }
  }

  private async getUserActivity(userId: string): Promise<UserSummary> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get user's organizations
    const memberships = await this.prisma.orgMembership.findMany({
      where: {
        userId,
        approvedAt: { not: null },
        isActive: true,
      },
      select: {
        orgId: true,
        organization: {
          select: { name: true },
        },
      },
    });

    const orgIds = memberships.map((m) => m.orgId);

    // Count new posts in user's organizations (not their own)
    const newPostsCount = await this.prisma.post.count({
      where: {
        orgId: { in: orgIds },
        authorId: { not: userId },
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    // Count new events in user's organizations
    const newEventsCount = await this.prisma.event.count({
      where: {
        orgId: { in: orgIds },
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    // Count unread messages
    const newMessagesCount = await this.prisma.message.count({
      where: {
        conversation: {
          participants: {
            some: { userId },
          },
        },
        senderId: { not: userId },
        createdAt: {
          gte: yesterday,
          lt: today,
        },
        readReceipts: {
          none: { userId },
        },
      },
    });

    // Get top 3 organizations with most activity
    const topOrganizations = memberships.slice(0, 3).map((m) => m.organization.name);

    return {
      userId,
      firstName: '',
      newPostsCount,
      newEventsCount,
      newMessagesCount,
      topOrganizations,
    };
  }

  private formatSummaryMessage(
    firstName: string,
    summary: UserSummary,
  ): { title: string; body: string } {
    const parts: string[] = [];

    if (summary.newPostsCount > 0) {
      parts.push(
        `${summary.newPostsCount} new post${summary.newPostsCount === 1 ? '' : 's'}`,
      );
    }

    if (summary.newEventsCount > 0) {
      parts.push(
        `${summary.newEventsCount} new event${summary.newEventsCount === 1 ? '' : 's'}`,
      );
    }

    if (summary.newMessagesCount > 0) {
      parts.push(
        `${summary.newMessagesCount} unread message${summary.newMessagesCount === 1 ? '' : 's'}`,
      );
    }

    const title = `Good morning, ${firstName}!`;
    let body = "Here's what you missed: ";

    if (parts.length === 1) {
      body += parts[0];
    } else if (parts.length === 2) {
      body += `${parts[0]} and ${parts[1]}`;
    } else {
      body += `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
    }

    return { title, body };
  }

  // Manual trigger for testing
  async sendTestSummary(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true },
    });

    if (!user) return false;

    return this.sendUserSummary(userId, user.firstName);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: any;
}

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  constructor(private prisma: PrismaService) {}

  async registerDevice(
    userId: string,
    token: string,
    platform: string,
    deviceName?: string,
  ) {
    // Check if token already exists
    const existing = await this.prisma.deviceToken.findUnique({
      where: { token },
    });

    if (existing) {
      // Update existing token (might be from a different user who logged out)
      return this.prisma.deviceToken.update({
        where: { token },
        data: {
          userId,
          platform,
          deviceName,
          isActive: true,
          lastUsedAt: new Date(),
        },
      });
    }

    // Create new device token
    return this.prisma.deviceToken.create({
      data: {
        userId,
        token,
        platform,
        deviceName,
        isActive: true,
      },
    });
  }

  async unregisterDevice(userId: string, token: string) {
    try {
      await this.prisma.deviceToken.deleteMany({
        where: {
          userId,
          token,
        },
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to unregister device: ${error.message}`);
      return false;
    }
  }

  async unregisterAllDevices(userId: string) {
    await this.prisma.deviceToken.deleteMany({
      where: { userId },
    });
    return true;
  }

  async getActiveDevices(userId: string) {
    return this.prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    const devices = await this.getActiveDevices(userId);
    if (devices.length === 0) {
      this.logger.debug(`No active devices for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    const messages: PushMessage[] = devices.map((device) => ({
      to: device.token,
      title,
      body,
      data,
      sound: 'default',
    }));

    return this.sendPushNotifications(messages);
  }

  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    const devices = await this.prisma.deviceToken.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
    });

    if (devices.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const messages: PushMessage[] = devices.map((device) => ({
      to: device.token,
      title,
      body,
      data,
      sound: 'default',
    }));

    return this.sendPushNotifications(messages);
  }

  async sendToOrganization(
    orgId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    // Get all members of the organization
    const members = await this.prisma.orgMembership.findMany({
      where: {
        orgId,
        isApproved: true,
      },
      select: { userId: true },
    });

    const userIds = members.map((m) => m.userId);
    return this.sendToUsers(userIds, title, body, data);
  }

  private async sendPushNotifications(messages: PushMessage[]) {
    if (messages.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // Batch messages (Expo API allows up to 100 per request)
    const batches = this.chunkArray(messages, 100);
    let sent = 0;
    let failed = 0;
    const invalidTokens: string[] = [];

    for (const batch of batches) {
      try {
        const response = await fetch(this.EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(batch),
        });

        const result = await response.json();
        const tickets: ExpoPushTicket[] = result.data || [];

        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          if (ticket.status === 'ok') {
            sent++;
          } else {
            failed++;
            // Check for invalid token errors
            if (
              ticket.details?.error === 'DeviceNotRegistered' ||
              ticket.details?.error === 'InvalidCredentials'
            ) {
              invalidTokens.push(batch[i].to);
            }
            this.logger.warn(
              `Push notification failed: ${ticket.message}`,
              ticket.details,
            );
          }
        }
      } catch (error) {
        this.logger.error(`Failed to send push notifications: ${error.message}`);
        failed += batch.length;
      }
    }

    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
      await this.deactivateInvalidTokens(invalidTokens);
    }

    return { sent, failed };
  }

  private async deactivateInvalidTokens(tokens: string[]) {
    try {
      await this.prisma.deviceToken.updateMany({
        where: {
          token: { in: tokens },
        },
        data: {
          isActive: false,
        },
      });
      this.logger.debug(`Deactivated ${tokens.length} invalid tokens`);
    } catch (error) {
      this.logger.error(`Failed to deactivate invalid tokens: ${error.message}`);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Update last used timestamp when user opens app
  async updateLastUsed(token: string) {
    try {
      await this.prisma.deviceToken.update({
        where: { token },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      // Token might not exist, ignore
    }
  }

  // Get count of registered devices for a user
  async getDeviceCount(userId: string) {
    return this.prisma.deviceToken.count({
      where: {
        userId,
        isActive: true,
      },
    });
  }
}

import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { CreateEventInput } from './dto/create-event.input';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private pushNotificationsService: PushNotificationsService,
  ) {}

  async findAll(limit: number = 20, offset: number = 0, orgId?: string) {
    const where: any = {
      isPublished: true,
      startTime: { gte: new Date() }, // Only future events
    };

    if (orgId) {
      where.orgId = orgId;
    }

    return this.prisma.event.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  async findById(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        rsvps: {
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
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async create(userId: string, input: CreateEventInput) {
    return this.prisma.event.create({
      data: {
        creatorId: userId,
        title: input.title,
        description: input.description,
        type: input.type as any,
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location,
        virtualLink: input.virtualLink,
        isVirtual: input.isVirtual || false,
        isPublished: true, // Events are published by default
        banner: input.banner,
        maxAttendees: input.maxAttendees,
        orgId: input.orgId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
        organization: true,
      },
    });
  }

  async rsvp(userId: string, eventId: string, status: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { rsvps: { where: { status: 'GOING' } } },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if event is full
    if (event.maxAttendees && event._count.rsvps >= event.maxAttendees) {
      throw new ForbiddenException('Event is full');
    }

    // Check for existing RSVP
    const existingRsvp = await this.prisma.eventRSVP.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingRsvp) {
      // Update existing RSVP
      return this.prisma.eventRSVP.update({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        data: { status },
      });
    }

    // Create new RSVP
    const rsvp = await this.prisma.eventRSVP.create({
      data: {
        eventId,
        userId,
        status,
      },
    });

    // Create notification and push notification for event creator
    if (event.creatorId !== userId && status === 'GOING') {
      // Get attendee info
      const attendee = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, displayName: true },
      });

      const attendeeName = attendee?.displayName ||
        `${attendee?.firstName} ${attendee?.lastName}`.trim() ||
        'Someone';

      // Get event title for notification
      const eventDetails = await this.prisma.event.findUnique({
        where: { id: eventId },
        select: { title: true },
      });

      // Create in-app notification
      await this.prisma.notification.create({
        data: {
          userId: event.creatorId,
          type: 'EVENT_RSVP',
          title: 'New RSVP',
          message: `${attendeeName} is attending your event`,
          data: { eventId, attendeeId: userId },
        },
      });

      // Send push notification
      try {
        await this.pushNotificationsService.sendToUser(
          event.creatorId,
          'New RSVP',
          `${attendeeName} is attending "${eventDetails?.title || 'your event'}"`,
          {
            type: 'event-rsvp',
            eventId,
            attendeeId: userId,
            screen: '/event',
          },
        );
      } catch (error) {
        this.logger.warn(`Failed to send RSVP notification: ${error.message}`);
      }
    }

    return rsvp;
  }

  async getUserEvents(userId: string, upcoming: boolean = true) {
    const where: any = {
      rsvps: {
        some: {
          userId,
          status: 'GOING',
        },
      },
    };

    if (upcoming) {
      where.startTime = { gte: new Date() };
    }

    return this.prisma.event.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
      orderBy: { startTime: upcoming ? 'asc' : 'desc' },
    });
  }

  /**
   * Get events for a user's invitations/discovery
   * Returns events that match:
   * 1. User is a member of the event's organization
   * 2. Event's location level exactly matches the user's location
   */
  async getEventsForUser(userId: string, limit: number = 20, offset: number = 0) {
    // Get user with their org memberships
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        stateId: true,
        lgaId: true,
        wardId: true,
        pollingUnitId: true,
        memberships: {
          where: {
            approvedAt: { not: null },
            isActive: true,
          },
          select: { orgId: true },
        },
      },
    });

    if (!user) {
      return [];
    }

    // Build location filter - exact match only
    const locationFilters: any[] = [];

    if (user.stateId) {
      locationFilters.push({ locationLevel: 'STATE', stateId: user.stateId });
    }
    if (user.lgaId) {
      locationFilters.push({ locationLevel: 'LGA', lgaId: user.lgaId });
    }
    if (user.wardId) {
      locationFilters.push({ locationLevel: 'WARD', wardId: user.wardId });
    }
    if (user.pollingUnitId) {
      locationFilters.push({ locationLevel: 'POLLING_UNIT', pollingUnitId: user.pollingUnitId });
    }

    // Get user's org IDs
    const userOrgIds = user.memberships.map((m) => m.orgId);

    // Build the where clause
    const where: any = {
      isPublished: true,
      startTime: { gte: new Date() },
      AND: [
        userOrgIds.length > 0 ? { orgId: { in: userOrgIds } } : { orgId: null },
        locationFilters.length > 0 ? { OR: locationFilters } : {},
      ],
    };

    return this.prisma.event.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  async inviteToEvent(inviterId: string, eventId: string, userIds: string[]) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Get inviter info
    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      select: { firstName: true, lastName: true, displayName: true },
    });

    const inviterName = inviter?.displayName ||
      `${inviter?.firstName} ${inviter?.lastName}`.trim() ||
      'Someone';

    // Create notifications and send push notifications
    const results = { invited: 0, failed: 0 };

    for (const userId of userIds) {
      try {
        // Check if user is already RSVP'd
        const existingRsvp = await this.prisma.eventRSVP.findUnique({
          where: {
            eventId_userId: { eventId, userId },
          },
        });

        if (existingRsvp) {
          continue; // Skip already RSVP'd users
        }

        // Create in-app notification
        await this.prisma.notification.create({
          data: {
            userId,
            type: 'EVENT_INVITE',
            title: 'Event Invitation',
            message: `${inviterName} invited you to ${event.title}`,
            data: { eventId, inviterId },
          },
        });

        // Format event date/time for notification
        const startTime = new Date(event.startTime);
        const dateStr = startTime.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        const timeStr = startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        // Send push notification
        await this.pushNotificationsService.sendToUser(
          userId,
          'Event Invitation',
          `${inviterName} invited you to "${event.title}" on ${dateStr} at ${timeStr}`,
          {
            type: 'event-invite',
            eventId: event.id,
            inviterId,
            screen: '/event',
          },
        );

        results.invited++;
      } catch (error) {
        this.logger.warn(`Failed to invite user ${userId} to event: ${error.message}`);
        results.failed++;
      }
    }

    return results;
  }

  async notifyOrgMembersOfNewEvent(event: any) {
    if (!event.orgId) return;

    // Get all members of the organization
    const members = await this.prisma.orgMembership.findMany({
      where: {
        orgId: event.orgId,
        approvedAt: { not: null },
        isActive: true,
        userId: { not: event.creatorId }, // Exclude creator
      },
      select: { userId: true },
    });

    if (members.length === 0) return;

    const userIds = members.map((m) => m.userId);

    // Format event date/time
    const startTime = new Date(event.startTime);
    const dateStr = startTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    // Create notifications for all members
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: 'NEW_EVENT',
        title: 'New Event',
        message: `New event: ${event.title} on ${dateStr}`,
        data: { eventId: event.id },
      })),
    });

    // Send push notifications
    await this.pushNotificationsService.sendToUsers(
      userIds,
      'New Event',
      `${event.title} - ${dateStr}`,
      {
        type: 'new-event',
        eventId: event.id,
        screen: '/event',
      },
    );

    this.logger.log(`Notified ${userIds.length} members about new event: ${event.title}`);
  }
}

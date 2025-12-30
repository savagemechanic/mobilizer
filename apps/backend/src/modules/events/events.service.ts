import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventInput } from './dto/create-event.input';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

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

    // Create notification for event creator
    if (event.creatorId !== userId && status === 'GOING') {
      await this.prisma.notification.create({
        data: {
          userId: event.creatorId,
          type: 'EVENT_INVITE',
          title: 'New RSVP',
          message: 'Someone is attending your event',
          data: { eventId, attendeeId: userId },
        },
      });
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
}

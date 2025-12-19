import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventInput } from './dto/create-event.input';
import { EventEntity, EventRSVPEntity } from './entities/event.entity';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver()
export class EventsResolver {
  constructor(private eventsService: EventsService) {}

  @Query(() => [EventEntity])
  @UseGuards(GqlAuthGuard)
  async events(
    @Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
    @Args('orgId', { nullable: true }) orgId?: string,
  ) {
    return this.eventsService.findAll(limit, offset, orgId);
  }

  @Query(() => EventEntity, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async event(@Args('id') id: string) {
    return this.eventsService.findById(id);
  }

  @Query(() => [EventEntity])
  @UseGuards(GqlAuthGuard)
  async myEvents(
    @CurrentUser() user: any,
    @Args('upcoming', { nullable: true, defaultValue: true }) upcoming?: boolean,
  ) {
    return this.eventsService.getUserEvents(user.id, upcoming);
  }

  @Mutation(() => EventEntity)
  @UseGuards(GqlAuthGuard)
  async createEvent(
    @CurrentUser() user: any,
    @Args('input') input: CreateEventInput,
  ) {
    return this.eventsService.create(user.id, input);
  }

  @Mutation(() => EventRSVPEntity)
  @UseGuards(GqlAuthGuard)
  async rsvpEvent(
    @CurrentUser() user: any,
    @Args('eventId') eventId: string,
    @Args('status', { defaultValue: 'GOING' }) status: string,
  ) {
    return this.eventsService.rsvp(user.id, eventId, status);
  }
}

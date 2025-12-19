import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationEntity } from './entities/notification.entity';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver()
export class NotificationsResolver {
  constructor(private notificationsService: NotificationsService) {}

  @Query(() => [NotificationEntity])
  @UseGuards(GqlAuthGuard)
  async notifications(
    @CurrentUser() user: any,
    @Args('limit', { nullable: true, defaultValue: 50 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
  ) {
    return this.notificationsService.getNotifications(user.id, limit, offset);
  }

  @Query(() => Int)
  @UseGuards(GqlAuthGuard)
  async unreadNotificationCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Mutation(() => NotificationEntity)
  @UseGuards(GqlAuthGuard)
  async markNotificationRead(
    @CurrentUser() user: any,
    @Args('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(user.id, notificationId);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async markAllNotificationsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteNotification(
    @CurrentUser() user: any,
    @Args('notificationId') notificationId: string,
  ) {
    return this.notificationsService.deleteNotification(user.id, notificationId);
  }
}

import { Module, Global } from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';
import { PushNotificationsResolver } from './push-notifications.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Global()
@Module({
  providers: [PushNotificationsService, PushNotificationsResolver, PrismaService],
  exports: [PushNotificationsService],
})
export class PushNotificationsModule {}

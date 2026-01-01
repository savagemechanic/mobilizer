import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PushNotificationsService } from './push-notifications.service';
import {
  RegisterDeviceInput,
  UnregisterDeviceInput,
} from './dto/register-device.input';
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
class DeviceToken {
  @Field()
  id: string;

  @Field()
  token: string;

  @Field()
  platform: string;

  @Field({ nullable: true })
  deviceName?: string;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  lastUsedAt?: Date;
}

@ObjectType()
class DeviceRegistrationResult {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  deviceId?: string;

  @Field({ nullable: true })
  message?: string;
}

@Resolver()
export class PushNotificationsResolver {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @Mutation(() => DeviceRegistrationResult)
  @UseGuards(JwtAuthGuard)
  async registerDevice(
    @CurrentUser() user: any,
    @Args('input') input: RegisterDeviceInput,
  ): Promise<DeviceRegistrationResult> {
    try {
      const device = await this.pushNotificationsService.registerDevice(
        user.id,
        input.token,
        input.platform,
        input.deviceName,
      );
      return {
        success: true,
        deviceId: device.id,
        message: 'Device registered successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to register device',
      };
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async unregisterDevice(
    @CurrentUser() user: any,
    @Args('input') input: UnregisterDeviceInput,
  ): Promise<boolean> {
    return this.pushNotificationsService.unregisterDevice(user.id, input.token);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async unregisterAllDevices(@CurrentUser() user: any): Promise<boolean> {
    return this.pushNotificationsService.unregisterAllDevices(user.id);
  }

  @Query(() => [DeviceToken])
  @UseGuards(JwtAuthGuard)
  async myDevices(@CurrentUser() user: any): Promise<DeviceToken[]> {
    return this.pushNotificationsService.getActiveDevices(user.id);
  }

  @Query(() => Int)
  @UseGuards(JwtAuthGuard)
  async myDeviceCount(@CurrentUser() user: any): Promise<number> {
    return this.pushNotificationsService.getDeviceCount(user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async updateDeviceLastUsed(
    @Args('token') token: string,
  ): Promise<boolean> {
    await this.pushNotificationsService.updateLastUsed(token);
    return true;
  }
}

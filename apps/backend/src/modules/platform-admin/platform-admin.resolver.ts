import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PlatformAdminService } from './platform-admin.service';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import { PlatformAdmin } from '../../common/decorators/platform-admin.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../auth/dto/auth-payload';
import { UserFilterInput } from './dto/user-filter.input';
import { UserPaginationInput } from './dto/user-pagination.input';
import { CreatePlatformAdminUserInput } from './dto/create-platform-admin-user.input';
import { PlatformStats } from './entities/platform-stats.entity';
import { SystemHealth } from './entities/system-health.entity';
import { PaginatedUsersResponse } from './entities/paginated-users.entity';
import { PlatformSettingsEntity } from './entities/platform-settings.entity';

@Resolver()
@UseGuards(GqlAuthGuard, PlatformAdminGuard)
export class PlatformAdminResolver {
  constructor(private platformAdminService: PlatformAdminService) {}

  @Query(() => PlatformStats)
  @PlatformAdmin()
  async platformStats(): Promise<PlatformStats> {
    return this.platformAdminService.getPlatformStats();
  }

  @Query(() => [User])
  @PlatformAdmin()
  async platformAdmins(): Promise<any[]> {
    return this.platformAdminService.getPlatformAdmins();
  }

  @Query(() => PaginatedUsersResponse)
  @PlatformAdmin()
  async allUsers(
    @Args('filter', { nullable: true }) filter?: UserFilterInput,
    @Args('pagination', { nullable: true }) pagination?: UserPaginationInput,
  ): Promise<PaginatedUsersResponse> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    return this.platformAdminService.getAllUsers(filter, limit, offset);
  }

  @Query(() => SystemHealth)
  @PlatformAdmin()
  async systemHealth(): Promise<SystemHealth> {
    return this.platformAdminService.getSystemHealth();
  }

  @Mutation(() => User)
  @PlatformAdmin()
  async grantPlatformAdmin(
    @CurrentUser() currentUser: any,
    @Args('userId') userId: string,
  ): Promise<any> {
    return this.platformAdminService.grantPlatformAdmin(userId, currentUser.id);
  }

  @Mutation(() => User)
  @PlatformAdmin()
  async revokePlatformAdmin(
    @CurrentUser() currentUser: any,
    @Args('userId') userId: string,
  ): Promise<any> {
    return this.platformAdminService.revokePlatformAdmin(userId, currentUser.id);
  }

  @Mutation(() => User)
  @PlatformAdmin()
  async suspendUser(
    @CurrentUser() currentUser: any,
    @Args('userId') userId: string,
    @Args('reason') reason: string,
  ): Promise<any> {
    return this.platformAdminService.suspendUser(userId, reason, currentUser.id);
  }

  @Mutation(() => User)
  @PlatformAdmin()
  async unsuspendUser(
    @CurrentUser() currentUser: any,
    @Args('userId') userId: string,
  ): Promise<any> {
    return this.platformAdminService.unsuspendUser(userId, currentUser.id);
  }

  @Mutation(() => User)
  @PlatformAdmin()
  async createPlatformAdminUser(
    @CurrentUser() currentUser: any,
    @Args('input') input: CreatePlatformAdminUserInput,
  ): Promise<any> {
    return this.platformAdminService.createPlatformAdminUser(input, currentUser.id);
  }

  @Query(() => PlatformSettingsEntity)
  @PlatformAdmin()
  async platformSettings(): Promise<any> {
    return this.platformAdminService.getPlatformSettings();
  }

  @Mutation(() => PlatformSettingsEntity)
  @PlatformAdmin()
  async togglePublicOrg(
    @CurrentUser() currentUser: any,
    @Args('enabled') enabled: boolean,
  ): Promise<any> {
    return this.platformAdminService.togglePublicOrg(enabled, currentUser.id);
  }

  @Mutation(() => PlatformSettingsEntity)
  @PlatformAdmin()
  async setPublicOrgId(
    @CurrentUser() currentUser: any,
    @Args('orgId') orgId: string,
  ): Promise<any> {
    return this.platformAdminService.setPublicOrgId(orgId, currentUser.id);
  }
}

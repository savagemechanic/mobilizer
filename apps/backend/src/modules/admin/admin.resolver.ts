import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { OrgFilterInput } from './dto/org-filter.input';
import { DateRangeInput } from './dto/date-range.input';
import { DashboardStats } from './entities/dashboard-stats.entity';
import { MemberAnalytics } from './entities/member-analytics.entity';
import { TrendPoint } from './entities/trend-data.entity';
import { WordCloudItem } from './entities/word-cloud.entity';
import { PostAnalytics } from './entities/post-analytics.entity';
import { EventAnalytics } from './entities/event-analytics.entity';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

@Resolver()
export class AdminResolver {
  constructor(private adminService: AdminService) {}

  @Query(() => DashboardStats)
  @UseGuards(GqlAuthGuard, SuperAdminGuard)
  async dashboardStats(
    @Args('movementId') movementId: string,
    @Args('orgFilter', { nullable: true }) orgFilter?: OrgFilterInput,
  ): Promise<DashboardStats> {
    return this.adminService.getDashboardStats(movementId, orgFilter);
  }

  @Query(() => MemberAnalytics)
  @UseGuards(GqlAuthGuard, SuperAdminGuard)
  async memberAnalytics(
    @Args('movementId') movementId: string,
    @Args('orgFilter', { nullable: true }) orgFilter?: OrgFilterInput,
  ): Promise<MemberAnalytics> {
    return this.adminService.getMemberAnalytics(movementId, orgFilter);
  }

  @Query(() => [TrendPoint])
  @UseGuards(GqlAuthGuard, SuperAdminGuard)
  async membershipTrend(
    @Args('movementId') movementId: string,
    @Args('dateRange') dateRange: DateRangeInput,
  ): Promise<TrendPoint[]> {
    return this.adminService.getMembershipTrend(movementId, dateRange);
  }

  @Query(() => PostAnalytics)
  @UseGuards(GqlAuthGuard, SuperAdminGuard)
  async postAnalytics(
    @Args('movementId') movementId: string,
    @Args('orgFilter', { nullable: true }) orgFilter?: OrgFilterInput,
  ): Promise<PostAnalytics> {
    return this.adminService.getPostAnalytics(movementId, orgFilter);
  }

  @Query(() => EventAnalytics)
  @UseGuards(GqlAuthGuard, SuperAdminGuard)
  async eventAnalytics(
    @Args('movementId') movementId: string,
    @Args('orgFilter', { nullable: true }) orgFilter?: OrgFilterInput,
  ): Promise<EventAnalytics> {
    return this.adminService.getEventAnalytics(movementId, orgFilter);
  }

  @Query(() => [WordCloudItem])
  @UseGuards(GqlAuthGuard, SuperAdminGuard)
  async wordCloud(
    @Args('movementId') movementId: string,
    @Args('orgFilter', { nullable: true }) orgFilter?: OrgFilterInput,
  ): Promise<WordCloudItem[]> {
    return this.adminService.getWordCloud(movementId, orgFilter);
  }

  @Query(() => String)
  @UseGuards(GqlAuthGuard, SuperAdminGuard)
  async aiSummary(@Args('movementId') movementId: string): Promise<string> {
    return this.adminService.getAISummary(movementId);
  }
}

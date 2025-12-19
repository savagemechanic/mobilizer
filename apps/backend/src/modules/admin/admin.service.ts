import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgFilterInput } from './dto/org-filter.input';
import { DateRangeInput } from './dto/date-range.input';
import { DashboardStats, LevelDistribution } from './entities/dashboard-stats.entity';
import { MemberAnalytics, GenderBreakdown, AgeGroup, LocationStat } from './entities/member-analytics.entity';
import { TrendPoint } from './entities/trend-data.entity';
import { WordCloudItem } from './entities/word-cloud.entity';
import { PostAnalytics, PostTypeBreakdown } from './entities/post-analytics.entity';
import { EventAnalytics, EventTypeBreakdown } from './entities/event-analytics.entity';
import { Gender } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Build a Prisma where clause based on org filter
   */
  private buildOrgWhereClause(movementId: string, orgFilter?: OrgFilterInput) {
    const where: any = {
      movementId,
      isActive: true,
    };

    if (orgFilter) {
      if (orgFilter.supportGroupId) {
        where.id = orgFilter.supportGroupId;
      }
      if (orgFilter.level) {
        where.level = orgFilter.level;
      }
      if (orgFilter.countryId) {
        where.countryId = orgFilter.countryId;
      }
      if (orgFilter.stateId) {
        where.stateId = orgFilter.stateId;
      }
      if (orgFilter.lgaId) {
        where.lgaId = orgFilter.lgaId;
      }
      if (orgFilter.wardId) {
        where.wardId = orgFilter.wardId;
      }
      if (orgFilter.pollingUnitId) {
        where.pollingUnitId = orgFilter.pollingUnitId;
      }
    }

    return where;
  }

  /**
   * Get organization IDs that match the filter
   */
  private async getFilteredOrgIds(movementId: string, orgFilter?: OrgFilterInput): Promise<string[]> {
    const where = this.buildOrgWhereClause(movementId, orgFilter);

    const orgs = await this.prisma.organization.findMany({
      where,
      select: { id: true },
    });

    return orgs.map(org => org.id);
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(movementId: string, orgFilter?: OrgFilterInput): Promise<DashboardStats> {
    const orgIds = await this.getFilteredOrgIds(movementId, orgFilter);
    const orgWhere = orgIds.length > 0 ? { orgId: { in: orgIds } } : {};

    // Calculate date for "this month"
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Total members (unique users across all filtered orgs)
    const uniqueMembers = await this.prisma.orgMembership.findMany({
      where: {
        ...orgWhere,
        isActive: true,
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    const totalMembers = uniqueMembers.length;

    // Total support groups
    const totalSupportGroups = orgIds.length;

    // Total posts
    const totalPosts = await this.prisma.post.count({
      where: {
        ...orgWhere,
        isPublished: true,
      },
    });

    // Total events
    const totalEvents = await this.prisma.event.count({
      where: {
        ...orgWhere,
        isPublished: true,
      },
    });

    // Active members (members who have posted or interacted in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeMemberIds = await this.prisma.post.findMany({
      where: {
        ...orgWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { authorId: true },
      distinct: ['authorId'],
    });

    const activeMembers = activeMemberIds.length;

    // New members this month
    const newMembersData = await this.prisma.orgMembership.findMany({
      where: {
        ...orgWhere,
        joinedAt: { gte: startOfMonth },
        isActive: true,
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    const newMembersThisMonth = newMembersData.length;

    // Level distribution
    const levelDistributionData = await this.prisma.organization.groupBy({
      by: ['level'],
      where: {
        movementId,
        isActive: true,
        ...(orgFilter ? this.buildOrgWhereClause(movementId, orgFilter) : {}),
      },
      _count: true,
    });

    const levelDistribution: LevelDistribution[] = levelDistributionData.map(item => ({
      level: item.level,
      count: item._count,
    }));

    return {
      totalMembers,
      totalSupportGroups,
      totalPosts,
      totalEvents,
      activeMembers,
      newMembersThisMonth,
      levelDistribution,
    };
  }

  /**
   * Get member analytics with gender, age, and location breakdowns
   */
  async getMemberAnalytics(movementId: string, orgFilter?: OrgFilterInput): Promise<MemberAnalytics> {
    const genderBreakdown = await this.getGenderBreakdown(movementId, orgFilter);
    const ageBreakdown = await this.getAgeBreakdown(movementId, orgFilter);
    const locationBreakdown = await this.getLocationBreakdown(movementId, orgFilter);

    return {
      genderBreakdown,
      ageBreakdown,
      locationBreakdown,
    };
  }

  /**
   * Get gender breakdown
   */
  async getGenderBreakdown(movementId: string, orgFilter?: OrgFilterInput): Promise<GenderBreakdown> {
    const orgIds = await this.getFilteredOrgIds(movementId, orgFilter);

    // Get unique user IDs from memberships
    const memberships = await this.prisma.orgMembership.findMany({
      where: {
        orgId: { in: orgIds },
        isActive: true,
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = memberships.map(m => m.userId);

    // Get users with their gender
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: { gender: true },
    });

    const genderCounts = {
      male: 0,
      female: 0,
      other: 0,
      notSpecified: 0,
    };

    users.forEach(user => {
      if (user.gender === Gender.MALE) {
        genderCounts.male++;
      } else if (user.gender === Gender.FEMALE) {
        genderCounts.female++;
      } else if (user.gender === Gender.OTHER) {
        genderCounts.other++;
      } else {
        genderCounts.notSpecified++;
      }
    });

    return genderCounts;
  }

  /**
   * Get age breakdown
   */
  async getAgeBreakdown(movementId: string, orgFilter?: OrgFilterInput): Promise<AgeGroup[]> {
    const orgIds = await this.getFilteredOrgIds(movementId, orgFilter);

    // Get unique user IDs from memberships
    const memberships = await this.prisma.orgMembership.findMany({
      where: {
        orgId: { in: orgIds },
        isActive: true,
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = memberships.map(m => m.userId);

    // Get users with their date of birth
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        dateOfBirth: { not: null },
      },
      select: { dateOfBirth: true },
    });

    // Calculate age groups
    const ageGroups: { [key: string]: number } = {
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45-54': 0,
      '55-64': 0,
      '65+': 0,
    };

    const currentDate = new Date();

    users.forEach(user => {
      if (user.dateOfBirth) {
        const age = currentDate.getFullYear() - user.dateOfBirth.getFullYear();

        if (age >= 18 && age <= 24) {
          ageGroups['18-24']++;
        } else if (age >= 25 && age <= 34) {
          ageGroups['25-34']++;
        } else if (age >= 35 && age <= 44) {
          ageGroups['35-44']++;
        } else if (age >= 45 && age <= 54) {
          ageGroups['45-54']++;
        } else if (age >= 55 && age <= 64) {
          ageGroups['55-64']++;
        } else if (age >= 65) {
          ageGroups['65+']++;
        }
      }
    });

    return Object.entries(ageGroups).map(([range, count]) => ({
      range,
      count,
    }));
  }

  /**
   * Get location breakdown (by state)
   */
  async getLocationBreakdown(movementId: string, orgFilter?: OrgFilterInput): Promise<LocationStat[]> {
    const orgIds = await this.getFilteredOrgIds(movementId, orgFilter);

    // Get unique user IDs from memberships
    const memberships = await this.prisma.orgMembership.findMany({
      where: {
        orgId: { in: orgIds },
        isActive: true,
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = memberships.map(m => m.userId);

    // Get users with their state
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        stateId: { not: null },
      },
      select: {
        state: {
          select: { name: true },
        },
      },
    });

    // Count by state
    const locationCounts: { [key: string]: number } = {};

    users.forEach(user => {
      if (user.state) {
        const stateName = user.state.name;
        locationCounts[stateName] = (locationCounts[stateName] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    return Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 locations
  }

  /**
   * Get membership trend over time
   */
  async getMembershipTrend(movementId: string, dateRange: DateRangeInput): Promise<TrendPoint[]> {
    const orgIds = await this.getFilteredOrgIds(movementId);

    // Get all memberships within the date range
    const memberships = await this.prisma.orgMembership.findMany({
      where: {
        orgId: { in: orgIds },
        joinedAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      select: { joinedAt: true },
      orderBy: { joinedAt: 'asc' },
    });

    // Group by date
    const trendMap: { [key: string]: number } = {};

    memberships.forEach(membership => {
      const dateStr = membership.joinedAt.toISOString().split('T')[0];
      trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
    });

    // Convert to array and calculate cumulative count
    const trendPoints: TrendPoint[] = [];
    let cumulativeCount = 0;

    Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, count]) => {
        cumulativeCount += count;
        trendPoints.push({ date, count: cumulativeCount });
      });

    return trendPoints;
  }

  /**
   * Get post analytics
   */
  async getPostAnalytics(movementId: string, orgFilter?: OrgFilterInput): Promise<PostAnalytics> {
    const orgIds = await this.getFilteredOrgIds(movementId, orgFilter);

    const posts = await this.prisma.post.findMany({
      where: {
        orgId: { in: orgIds },
        isPublished: true,
      },
      include: {
        poll: true,
      },
    });

    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, post) => sum + post.likeCount, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.commentCount, 0);
    const totalShares = posts.reduce((sum, post) => sum + post.shareCount, 0);
    const totalPolls = posts.filter(post => post.poll).length;

    // Group by type
    const typeMap: { [key: string]: number } = {};
    posts.forEach(post => {
      typeMap[post.type] = (typeMap[post.type] || 0) + 1;
    });

    const postsByType: PostTypeBreakdown[] = Object.entries(typeMap).map(([type, count]) => ({
      type,
      count,
    }));

    const averageLikesPerPost = totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0;
    const averageCommentsPerPost = totalPosts > 0 ? Math.round(totalComments / totalPosts) : 0;

    return {
      totalPosts,
      totalLikes,
      totalComments,
      totalShares,
      totalPolls,
      postsByType,
      averageLikesPerPost,
      averageCommentsPerPost,
    };
  }

  /**
   * Get event analytics
   */
  async getEventAnalytics(movementId: string, orgFilter?: OrgFilterInput): Promise<EventAnalytics> {
    const orgIds = await this.getFilteredOrgIds(movementId, orgFilter);
    const now = new Date();

    const events = await this.prisma.event.findMany({
      where: {
        orgId: { in: orgIds },
        isPublished: true,
      },
      include: {
        _count: {
          select: { rsvps: true },
        },
      },
    });

    const totalEvents = events.length;
    const upcomingEvents = events.filter(event => event.startTime > now).length;
    const pastEvents = events.filter(event => event.startTime <= now).length;
    const totalRSVPs = events.reduce((sum, event) => sum + event._count.rsvps, 0);

    // Group by type
    const typeMap: { [key: string]: number } = {};
    events.forEach(event => {
      typeMap[event.type] = (typeMap[event.type] || 0) + 1;
    });

    const eventsByType: EventTypeBreakdown[] = Object.entries(typeMap).map(([type, count]) => ({
      type,
      count,
    }));

    const averageRSVPsPerEvent = totalEvents > 0 ? Math.round(totalRSVPs / totalEvents) : 0;

    return {
      totalEvents,
      upcomingEvents,
      pastEvents,
      totalRSVPs,
      eventsByType,
      averageRSVPsPerEvent,
    };
  }

  /**
   * Get word cloud from posts
   */
  async getWordCloud(movementId: string, orgFilter?: OrgFilterInput): Promise<WordCloudItem[]> {
    const orgIds = await this.getFilteredOrgIds(movementId, orgFilter);

    const posts = await this.prisma.post.findMany({
      where: {
        orgId: { in: orgIds },
        isPublished: true,
      },
      select: { content: true },
    });

    // Extract words from all posts
    const wordMap: { [key: string]: number } = {};

    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
      'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    ]);

    posts.forEach(post => {
      // Simple word extraction (split by spaces and clean)
      const words = post.content
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word)); // Filter short words and stop words

      words.forEach(word => {
        wordMap[word] = (wordMap[word] || 0) + 1;
      });
    });

    // Convert to array and sort by frequency
    return Object.entries(wordMap)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50 words
  }

  /**
   * Get AI-generated summary (placeholder)
   */
  async getAISummary(movementId: string): Promise<string> {
    // This is a placeholder for AI integration
    // In a real implementation, you would:
    // 1. Gather key metrics and trends
    // 2. Send to an AI service (OpenAI, etc.)
    // 3. Return the generated summary

    const stats = await this.getDashboardStats(movementId);

    return `Your movement has ${stats.totalMembers} members across ${stats.totalSupportGroups} support groups.
There have been ${stats.totalPosts} posts and ${stats.totalEvents} events created.
${stats.activeMembers} members have been active in the last 30 days, and you gained
${stats.newMembersThisMonth} new members this month. The movement is showing healthy engagement
and growth across all levels of the organization.`;
  }
}

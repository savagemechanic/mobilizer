import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgFilterInput } from './dto/org-filter.input';
import { DateRangeInput } from './dto/date-range.input';
import { DashboardStats, LevelDistribution } from './entities/dashboard-stats.entity';
import { MemberAnalytics, GenderBreakdown, AgeGroup, LocationStat, ProfessionStat, GeopoliticalZoneStat } from './entities/member-analytics.entity';
import { TrendPoint } from './entities/trend-data.entity';
import { WordCloudItem } from './entities/word-cloud.entity';
import { PostAnalytics, PostTypeBreakdown } from './entities/post-analytics.entity';
import { EventAnalytics, EventTypeBreakdown } from './entities/event-analytics.entity';
import { Gender } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get LGA IDs based on zone filters (geopolitical, senatorial, federal constituency)
   */
  private async getLgaIdsFromZoneFilters(orgFilter: OrgFilterInput): Promise<string[] | null> {
    // If geopolitical zone is specified, get all LGAs in that zone
    // LGAs have a direct geopoliticalZoneId field in the schema
    if (orgFilter.geopoliticalZoneId) {
      const lgas = await this.prisma.lGA.findMany({
        where: { geopoliticalZoneId: orgFilter.geopoliticalZoneId },
        select: { id: true },
      });
      return lgas.map(l => l.id);
    }

    // If senatorial zone is specified, get all LGAs in that zone
    if (orgFilter.senatorialZoneId) {
      const lgas = await this.prisma.lGA.findMany({
        where: { senatorialZoneId: orgFilter.senatorialZoneId },
        select: { id: true },
      });
      return lgas.map(l => l.id);
    }

    // If federal constituency is specified, get all LGAs in that constituency
    if (orgFilter.federalConstituencyId) {
      const lgas = await this.prisma.lGA.findMany({
        where: { federalConstituencyId: orgFilter.federalConstituencyId },
        select: { id: true },
      });
      return lgas.map(l => l.id);
    }

    return null;
  }

  /**
   * Build a Prisma where clause based on org filter
   */
  private async buildOrgWhereClause(movementId: string, orgFilter?: OrgFilterInput) {
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

      // Handle zone-based filters (these require LGA lookups)
      const zoneLgaIds = await this.getLgaIdsFromZoneFilters(orgFilter);
      if (zoneLgaIds) {
        where.lgaId = { in: zoneLgaIds };
      } else if (orgFilter.lgaId) {
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
    const where = await this.buildOrgWhereClause(movementId, orgFilter);

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
        isBlocked: false,
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
        isBlocked: false,
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    const newMembersThisMonth = newMembersData.length;

    // Level distribution
    const orgWhereClause = await this.buildOrgWhereClause(movementId, orgFilter);
    const levelDistributionData = await this.prisma.organization.groupBy({
      by: ['level'],
      where: orgWhereClause,
      _count: true,
    });

    const levelDistribution: LevelDistribution[] = levelDistributionData.map(item => ({
      level: item.level,
      count: item._count,
    }));

    // Calculate coverage statistics from members
    // Get unique location IDs from all members
    const members = await this.prisma.user.findMany({
      where: {
        memberships: {
          some: {
            ...orgWhere,
            isActive: true,
            isBlocked: false,
          },
        },
      },
      select: {
        countryId: true,
        stateId: true,
        lgaId: true,
        wardId: true,
        pollingUnitId: true,
      },
    });

    // Count unique locations
    const uniqueCountries = new Set(members.map(m => m.countryId).filter(Boolean));
    const uniqueStates = new Set(members.map(m => m.stateId).filter(Boolean));
    const uniqueLgas = new Set(members.map(m => m.lgaId).filter(Boolean));
    const uniqueWards = new Set(members.map(m => m.wardId).filter(Boolean));
    const uniquePollingUnits = new Set(members.map(m => m.pollingUnitId).filter(Boolean));

    const countriesCovered = uniqueCountries.size;
    const statesCovered = uniqueStates.size;
    const lgasCovered = uniqueLgas.size;
    const wardsCovered = uniqueWards.size;
    const pollingUnitsCovered = uniquePollingUnits.size;

    // Get total counts for the country (or filtered country)
    // Determine which country to use for totals
    let totalStates = 0;
    let totalLgas = 0;
    let totalWards = 0;
    let totalPollingUnits = 0;

    let countryIdForTotals: string | null = null;

    if (orgFilter?.countryId) {
      // Use the filtered country
      countryIdForTotals = orgFilter.countryId;
    } else {
      // Get the country from the movement's organizations
      const firstOrg = await this.prisma.organization.findFirst({
        where: {
          movementId,
          countryId: { not: null },
        },
        select: { countryId: true },
      });
      countryIdForTotals = firstOrg?.countryId || null;
    }

    // Count totals for the determined country
    if (countryIdForTotals) {
      totalStates = await this.prisma.state.count({
        where: { countryId: countryIdForTotals },
      });
      totalLgas = await this.prisma.lGA.count({
        where: { state: { countryId: countryIdForTotals } },
      });
      totalWards = await this.prisma.ward.count({
        where: { lga: { state: { countryId: countryIdForTotals } } },
      });
      totalPollingUnits = await this.prisma.pollingUnit.count({
        where: { ward: { lga: { state: { countryId: countryIdForTotals } } } },
      });
    }

    return {
      totalMembers,
      totalSupportGroups,
      totalPosts,
      totalEvents,
      activeMembers,
      newMembersThisMonth,
      levelDistribution,
      countriesCovered,
      statesCovered,
      lgasCovered,
      wardsCovered,
      pollingUnitsCovered,
      totalStates,
      totalLgas,
      totalWards,
      totalPollingUnits,
    };
  }

  /**
   * Get member analytics with gender, age, location, profession, and geopolitical zone breakdowns
   */
  async getMemberAnalytics(movementId: string, orgFilter?: OrgFilterInput): Promise<MemberAnalytics> {
    const genderBreakdown = await this.getGenderBreakdown(movementId, orgFilter);
    const ageBreakdown = await this.getAgeBreakdown(movementId, orgFilter);
    const locationBreakdown = await this.getLocationBreakdown(movementId, orgFilter);
    const professionBreakdown = await this.getProfessionBreakdown(movementId, orgFilter);
    const geopoliticalZoneBreakdown = await this.getGeopoliticalZoneBreakdown(movementId, orgFilter);

    return {
      genderBreakdown,
      ageBreakdown,
      locationBreakdown,
      professionBreakdown,
      geopoliticalZoneBreakdown,
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
   * Get profession breakdown
   */
  async getProfessionBreakdown(movementId: string, orgFilter?: OrgFilterInput): Promise<ProfessionStat[]> {
    const orgIds = await this.getFilteredOrgIds(movementId, orgFilter);

    // Get unique user IDs from memberships
    const memberships = await this.prisma.orgMembership.findMany({
      where: {
        orgId: { in: orgIds },
        isActive: true,
        isBlocked: false,
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = memberships.map(m => m.userId);

    // Get users with their profession
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        profession: { not: null },
      },
      select: { profession: true },
    });

    // Count by profession
    const professionCounts: { [key: string]: number } = {};

    users.forEach(user => {
      if (user.profession) {
        professionCounts[user.profession] = (professionCounts[user.profession] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    return Object.entries(professionCounts)
      .map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Top 15 professions
  }

  /**
   * Get geopolitical zone breakdown
   */
  async getGeopoliticalZoneBreakdown(movementId: string, orgFilter?: OrgFilterInput): Promise<GeopoliticalZoneStat[]> {
    const orgIds = await this.getFilteredOrgIds(movementId, orgFilter);

    // Get unique user IDs from memberships
    const memberships = await this.prisma.orgMembership.findMany({
      where: {
        orgId: { in: orgIds },
        isActive: true,
        isBlocked: false,
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = memberships.map(m => m.userId);

    // Get users with their state and the state's geopolitical zone
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        stateId: { not: null },
      },
      select: {
        state: {
          select: {
            geopoliticalZone: {
              select: { name: true, code: true },
            },
          },
        },
      },
    });

    // Count by geopolitical zone
    const zoneCounts: { [key: string]: { name: string; code: string; count: number } } = {};

    users.forEach(user => {
      if (user.state?.geopoliticalZone) {
        const zone = user.state.geopoliticalZone;
        if (!zoneCounts[zone.code]) {
          zoneCounts[zone.code] = { name: zone.name, code: zone.code, count: 0 };
        }
        zoneCounts[zone.code].count++;
      }
    });

    // Convert to array and sort by count
    return Object.values(zoneCounts).sort((a, b) => b.count - a.count);
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

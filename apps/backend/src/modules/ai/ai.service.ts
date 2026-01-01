import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';

interface OrganizationActivity {
  totalPosts: number;
  postsLastWeek: number;
  totalEvents: number;
  upcomingEvents: number;
  totalMembers: number;
  newMembersLastWeek: number;
  topTopics: string[];
  recentHighlights: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not configured - AI features will use fallback');
    }
  }

  async generateOrganizationSummary(orgId: string): Promise<string> {
    try {
      // Get organization data
      const org = await this.prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          name: true,
          description: true,
          level: true,
        },
      });

      if (!org) {
        return 'Organization not found.';
      }

      // Get activity data
      const activity = await this.getOrganizationActivity(orgId);

      // Generate summary using AI or fallback
      if (this.openai) {
        return this.generateAISummary(org.name, org.description, org.level, activity);
      } else {
        return this.generateFallbackSummary(org.name, activity);
      }
    } catch (error) {
      this.logger.error(`Failed to generate summary: ${error.message}`);
      return 'Unable to generate summary at this time.';
    }
  }

  private async getOrganizationActivity(orgId: string): Promise<OrganizationActivity> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get total and recent posts
    const [totalPosts, postsLastWeek] = await Promise.all([
      this.prisma.post.count({ where: { orgId } }),
      this.prisma.post.count({
        where: {
          orgId,
          createdAt: { gte: oneWeekAgo },
        },
      }),
    ]);

    // Get events
    const [totalEvents, upcomingEvents] = await Promise.all([
      this.prisma.event.count({ where: { orgId } }),
      this.prisma.event.count({
        where: {
          orgId,
          startTime: { gte: now },
        },
      }),
    ]);

    // Get members
    const [totalMembers, newMembersLastWeek] = await Promise.all([
      this.prisma.orgMembership.count({
        where: { orgId, approvedAt: { not: null }, isActive: true },
      }),
      this.prisma.orgMembership.count({
        where: {
          orgId,
          approvedAt: { not: null },
          isActive: true,
          joinedAt: { gte: oneWeekAgo },
        },
      }),
    ]);

    // Get recent posts for topic extraction
    const recentPosts = await this.prisma.post.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { content: true },
    });

    const topTopics = this.extractTopics(recentPosts.map((p) => p.content));
    const recentHighlights = await this.getRecentHighlights(orgId);

    return {
      totalPosts,
      postsLastWeek,
      totalEvents,
      upcomingEvents,
      totalMembers,
      newMembersLastWeek,
      topTopics,
      recentHighlights,
    };
  }

  private extractTopics(contents: string[]): string[] {
    // Simple keyword extraction (could be enhanced with NLP)
    const allText = contents.join(' ').toLowerCase();
    const words = allText.split(/\W+/).filter((w) => w.length > 4);

    // Count word frequency
    const frequency: Record<string, number> = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Get top 5 words
    const sorted = Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    return sorted;
  }

  private async getRecentHighlights(orgId: string): Promise<string[]> {
    const highlights: string[] = [];

    // Most liked post
    const topPost = await this.prisma.post.findFirst({
      where: { orgId },
      orderBy: { likeCount: 'desc' },
      select: { content: true, likeCount: true },
    });

    if (topPost && topPost.likeCount > 0) {
      highlights.push(
        `Most popular post received ${topPost.likeCount} likes`,
      );
    }

    // Upcoming event
    const nextEvent = await this.prisma.event.findFirst({
      where: {
        orgId,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      select: { title: true, startTime: true },
    });

    if (nextEvent) {
      highlights.push(`Upcoming event: ${nextEvent.title}`);
    }

    return highlights;
  }

  private async generateAISummary(
    name: string,
    description: string | null,
    level: string,
    activity: OrganizationActivity,
  ): Promise<string> {
    if (!this.openai) return this.generateFallbackSummary(name, activity);

    const prompt = `Generate a brief, engaging summary (2-3 sentences) for a political organization:

Organization: ${name}
Level: ${level}
Description: ${description || 'N/A'}

Activity Stats:
- ${activity.totalMembers} total members (${activity.newMembersLastWeek} joined this week)
- ${activity.totalPosts} total posts (${activity.postsLastWeek} this week)
- ${activity.upcomingEvents} upcoming events

Recent Highlights: ${activity.recentHighlights.join(', ') || 'None'}
Trending Topics: ${activity.topTopics.join(', ') || 'General discussions'}

Write a friendly, informative summary that highlights the group's activity and engagement. Keep it concise and positive.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that writes brief, engaging summaries for community organizations. Keep responses under 100 words.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || this.generateFallbackSummary(name, activity);
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`);
      return this.generateFallbackSummary(name, activity);
    }
  }

  private generateFallbackSummary(
    name: string,
    activity: OrganizationActivity,
  ): string {
    const parts: string[] = [];

    parts.push(`${name} is an active community`);

    if (activity.totalMembers > 0) {
      parts.push(`with ${activity.totalMembers} members`);
    }

    if (activity.postsLastWeek > 0) {
      parts.push(
        `${activity.postsLastWeek} new posts were shared this week`,
      );
    }

    if (activity.upcomingEvents > 0) {
      parts.push(
        `${activity.upcomingEvents} upcoming event${activity.upcomingEvents === 1 ? '' : 's'}`,
      );
    }

    if (activity.newMembersLastWeek > 0) {
      parts.push(
        `Welcome to our ${activity.newMembersLastWeek} new member${activity.newMembersLastWeek === 1 ? '' : 's'}!`,
      );
    }

    return parts.length > 1
      ? parts.join('. ') + '.'
      : 'Welcome to our community! Stay tuned for updates.';
  }

  async generatePostSuggestions(orgId: string): Promise<string[]> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, level: true },
    });

    if (!org) return [];

    // Default suggestions based on org level
    const suggestions: string[] = [];

    switch (org.level) {
      case 'NATIONAL':
        suggestions.push(
          'Share updates on national initiatives',
          'Post about policy discussions',
          'Announce nationwide events',
        );
        break;
      case 'STATE':
        suggestions.push(
          'Share state-level news and updates',
          'Highlight local success stories',
          'Announce upcoming state events',
        );
        break;
      case 'LGA':
        suggestions.push(
          'Share local community updates',
          'Celebrate member achievements',
          'Organize community meetups',
        );
        break;
      case 'WARD':
      case 'POLLING_UNIT':
        suggestions.push(
          'Connect with your neighbors',
          'Share local news and updates',
          'Organize grassroots activities',
        );
        break;
    }

    return suggestions;
  }
}

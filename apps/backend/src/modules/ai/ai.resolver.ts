import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class OrganizationSummary {
  @Field()
  summary: string;

  @Field(() => [String])
  suggestions: string[];

  @Field()
  generatedAt: Date;
}

@Resolver()
export class AiResolver {
  constructor(private readonly aiService: AiService) {}

  @Query(() => OrganizationSummary)
  @UseGuards(JwtAuthGuard)
  async organizationAISummary(
    @Args('orgId') orgId: string,
  ): Promise<OrganizationSummary> {
    const [summary, suggestions] = await Promise.all([
      this.aiService.generateOrganizationSummary(orgId),
      this.aiService.generatePostSuggestions(orgId),
    ]);

    return {
      summary,
      suggestions,
      generatedAt: new Date(),
    };
  }
}

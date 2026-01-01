import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { AiService } from './ai.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class OrganizationAISummaryResponse {
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

  @Query(() => OrganizationAISummaryResponse)
  @UseGuards(GqlAuthGuard)
  async organizationAISummary(
    @Args('orgId') orgId: string,
  ): Promise<OrganizationAISummaryResponse> {
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

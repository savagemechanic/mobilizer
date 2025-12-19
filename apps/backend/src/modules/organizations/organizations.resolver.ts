import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrgInput } from './dto/create-org.input';
import { OrganizationFilterInput } from './dto/org-filter.input';
import { MakeLeaderInput } from './dto/make-leader.input';
import { OrganizationEntity, OrgMembershipEntity } from './entities/organization.entity';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver()
export class OrganizationsResolver {
  constructor(private organizationsService: OrganizationsService) {}

  @Query(() => [OrganizationEntity])
  @UseGuards(GqlAuthGuard)
  async organizations(
    @Args('filter', { nullable: true }) filter?: OrganizationFilterInput,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
  ) {
    return this.organizationsService.findAll(filter, limit, offset);
  }

  @Query(() => OrganizationEntity, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async organization(@Args('id') id: string) {
    return this.organizationsService.findById(id);
  }

  @Query(() => OrganizationEntity, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async organizationBySlug(@Args('slug') slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  @Query(() => [OrganizationEntity])
  @UseGuards(GqlAuthGuard)
  async myOrganizations(@CurrentUser() user: any) {
    return this.organizationsService.getUserOrganizations(user.id);
  }

  @Mutation(() => OrganizationEntity)
  @UseGuards(GqlAuthGuard)
  async createOrganization(
    @CurrentUser() user: any,
    @Args('input') input: CreateOrgInput,
  ) {
    return this.organizationsService.create(user.id, input);
  }

  @Mutation(() => OrgMembershipEntity)
  @UseGuards(GqlAuthGuard)
  async joinOrganization(
    @CurrentUser() user: any,
    @Args('orgId') orgId: string,
  ) {
    return this.organizationsService.joinOrganization(user.id, orgId);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async leaveOrganization(
    @CurrentUser() user: any,
    @Args('orgId') orgId: string,
  ) {
    return this.organizationsService.leaveOrganization(user.id, orgId);
  }

  @Query(() => [OrgMembershipEntity])
  @UseGuards(GqlAuthGuard)
  async getOrgMembers(
    @Args('orgId') orgId: string,
    @Args('search', { nullable: true }) search?: string,
    @Args('isAdmin', { nullable: true }) isAdmin?: boolean,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
  ) {
    return this.organizationsService.getOrgMembers(orgId, { search, isAdmin }, limit, offset);
  }

  @Mutation(() => OrgMembershipEntity)
  @UseGuards(GqlAuthGuard)
  async updateMemberRole(
    @CurrentUser() user: any,
    @Args('membershipId') membershipId: string,
    @Args('isAdmin') isAdmin: boolean,
  ) {
    return this.organizationsService.updateMemberRole(user.id, membershipId, isAdmin);
  }

  @Mutation(() => OrgMembershipEntity)
  @UseGuards(GqlAuthGuard)
  async makeLeader(
    @CurrentUser() user: any,
    @Args('input') input: MakeLeaderInput,
  ) {
    return this.organizationsService.makeLeader(input, user.id);
  }

  @Mutation(() => OrgMembershipEntity)
  @UseGuards(GqlAuthGuard)
  async removeLeader(
    @CurrentUser() user: any,
    @Args('membershipId') membershipId: string,
  ) {
    return this.organizationsService.removeLeader(membershipId);
  }
}

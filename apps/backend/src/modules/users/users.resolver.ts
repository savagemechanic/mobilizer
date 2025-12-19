import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileInput } from './dto/update-profile.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../auth/dto/auth-payload';
import { OrgMembershipEntity } from '../organizations/entities/organization.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async user(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @Query(() => [User])
  @UseGuards(GqlAuthGuard)
  async searchUsers(
    @Args('query') query: string,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset: number,
  ) {
    return this.usersService.searchUsers(query, limit, offset);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Args('input') input: UpdateProfileInput,
  ) {
    return this.usersService.updateProfile(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async followUser(
    @CurrentUser() user: any,
    @Args('userId') userId: string,
  ) {
    await this.usersService.followUser(user.id, userId);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async unfollowUser(
    @CurrentUser() user: any,
    @Args('userId') userId: string,
  ) {
    return this.usersService.unfollowUser(user.id, userId);
  }

  @Query(() => [User])
  @UseGuards(GqlAuthGuard)
  async followers(
    @Args('userId') userId: string,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset: number,
  ) {
    return this.usersService.getFollowers(userId, limit, offset);
  }

  @Query(() => [User])
  @UseGuards(GqlAuthGuard)
  async following(
    @Args('userId') userId: string,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset: number,
  ) {
    return this.usersService.getFollowing(userId, limit, offset);
  }

  @Query(() => [OrgMembershipEntity])
  @UseGuards(GqlAuthGuard)
  async userMemberships(@Args('userId') userId: string) {
    return this.usersService.getUserMemberships(userId);
  }
}

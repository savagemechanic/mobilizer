import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostInput } from './dto/create-post.input';
import { PostEntity, CommentEntity } from './entities/post.entity';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver()
export class PostsResolver {
  constructor(private postsService: PostsService) {}

  @Query(() => [PostEntity])
  @UseGuards(GqlAuthGuard)
  async feed(
    @CurrentUser() user: any,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
  ) {
    return this.postsService.getFeed(user.id, limit, offset);
  }

  @Query(() => [PostEntity])
  @UseGuards(GqlAuthGuard)
  async polls(
    @CurrentUser() user: any,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
    @Args('organizationId', { nullable: true }) organizationId?: string,
  ) {
    return this.postsService.getPolls(user.id, limit, offset, organizationId);
  }

  @Query(() => PostEntity, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async post(@Args('id') id: string) {
    return this.postsService.findById(id);
  }

  @Mutation(() => PostEntity)
  @UseGuards(GqlAuthGuard)
  async createPost(
    @CurrentUser() user: any,
    @Args('input') input: CreatePostInput,
  ) {
    return this.postsService.create(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deletePost(
    @CurrentUser() user: any,
    @Args('postId') postId: string,
  ) {
    return this.postsService.delete(user.id, postId);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async likePost(
    @CurrentUser() user: any,
    @Args('postId') postId: string,
  ) {
    return this.postsService.like(user.id, postId);
  }

  @Mutation(() => CommentEntity)
  @UseGuards(GqlAuthGuard)
  async createComment(
    @CurrentUser() user: any,
    @Args('postId') postId: string,
    @Args('content') content: string,
    @Args('parentId', { nullable: true }) parentId?: string,
  ) {
    return this.postsService.createComment(user.id, postId, content, parentId);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async castVote(
    @CurrentUser() user: any,
    @Args('pollId') pollId: string,
    @Args('optionId') optionId: string,
  ) {
    return this.postsService.castVote(user.id, pollId, optionId);
  }
}

import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostInput } from './dto/create-post.input';
import { FeedFilterInput } from './dto/feed-filter.input';
import {
  PostEntity,
  CommentEntity,
  LikeResultEntity,
  ShareResultEntity,
} from './entities/post.entity';
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
    @Args('filter', { nullable: true }) filter?: FeedFilterInput,
  ) {
    return this.postsService.getFeed(user.id, limit, offset, filter);
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
  async post(@Args('id') id: string, @CurrentUser() user: any) {
    return this.postsService.findById(id, user?.id);
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

  @Mutation(() => LikeResultEntity, { description: 'Like or unlike a post. Returns the new like state and count.' })
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

  @Mutation(() => LikeResultEntity, { description: 'Like or unlike a comment. Returns the new like state and count.' })
  @UseGuards(GqlAuthGuard)
  async likeComment(
    @CurrentUser() user: any,
    @Args('commentId') commentId: string,
  ) {
    return this.postsService.likeComment(user.id, commentId);
  }

  @Mutation(() => Boolean, { description: 'Soft delete a comment. Only the author can delete their own comments.' })
  @UseGuards(GqlAuthGuard)
  async deleteComment(
    @CurrentUser() user: any,
    @Args('commentId') commentId: string,
  ) {
    return this.postsService.deleteComment(user.id, commentId);
  }

  @Mutation(() => CommentEntity, { description: 'Update a comment. Only the author can edit their own comments.' })
  @UseGuards(GqlAuthGuard)
  async updateComment(
    @CurrentUser() user: any,
    @Args('commentId') commentId: string,
    @Args('content') content: string,
  ) {
    return this.postsService.updateComment(user.id, commentId, content);
  }

  @Mutation(() => ShareResultEntity, { description: 'Record a share action for a post.' })
  @UseGuards(GqlAuthGuard)
  async sharePost(
    @CurrentUser() user: any,
    @Args('postId') postId: string,
    @Args('platform', { nullable: true, defaultValue: 'internal' }) platform?: string,
  ) {
    return this.postsService.sharePost(user.id, postId, platform);
  }

  @Query(() => [CommentEntity], { description: 'Get comments for a post.' })
  @UseGuards(GqlAuthGuard)
  async comments(
    @CurrentUser() user: any,
    @Args('postId') postId: string,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
  ) {
    return this.postsService.getComments(postId, user.id, limit, offset);
  }

  @Query(() => [CommentEntity], { description: 'Get replies for a comment.' })
  @UseGuards(GqlAuthGuard)
  async replies(
    @CurrentUser() user: any,
    @Args('commentId') commentId: string,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
  ) {
    return this.postsService.getReplies(commentId, user.id, limit, offset);
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

  @Query(() => String, { description: 'Get share text for a post with location context (for external sharing - includes marketing text).' })
  @UseGuards(GqlAuthGuard)
  async postShareText(
    @Args('postId') postId: string,
  ) {
    return this.postsService.getShareText(postId, true);
  }

  @Query(() => [PostEntity], { description: 'Search posts by content.' })
  @UseGuards(GqlAuthGuard)
  async searchPosts(
    @CurrentUser() user: any,
    @Args('query') query: string,
    @Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
  ) {
    return this.postsService.searchPosts(user.id, query, limit, offset);
  }

  @Query(() => String, { description: 'Get repost text for a post (for internal repost - no marketing text).' })
  @UseGuards(GqlAuthGuard)
  async postRepostText(
    @Args('postId') postId: string,
  ) {
    return this.postsService.getShareText(postId, false);
  }
}

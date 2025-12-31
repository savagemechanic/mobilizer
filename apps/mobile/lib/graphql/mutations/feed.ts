import { gql } from '@apollo/client';
import { POST_FRAGMENT, COMMENT_FRAGMENT } from '../queries/feed';

/**
 * Result type for like operations
 */
export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

/**
 * Result type for share operations
 */
export interface ShareResult {
  id: string;
  shareCount: number;
  platform: string;
}


/**
 * Mutation to like/unlike a post
 * Returns the new like state and updated count
 */
export const LIKE_POST = gql`
  mutation LikePost($postId: String!) {
    likePost(postId: $postId) {
      liked
      likeCount
    }
  }
`;

/**
 * Mutation to like/unlike a comment
 * Returns the new like state and updated count
 */
export const LIKE_COMMENT = gql`
  mutation LikeComment($commentId: String!) {
    likeComment(commentId: $commentId) {
      liked
      likeCount
    }
  }
`;

/**
 * Mutation to create a comment on a post
 */
export const CREATE_COMMENT = gql`
  ${COMMENT_FRAGMENT}
  mutation CreateComment($postId: String!, $content: String!, $parentId: String) {
    createComment(postId: $postId, content: $content, parentId: $parentId) {
      ...CommentFields
    }
  }
`;

/**
 * Mutation to update a comment
 */
export const UPDATE_COMMENT = gql`
  ${COMMENT_FRAGMENT}
  mutation UpdateComment($commentId: String!, $content: String!) {
    updateComment(commentId: $commentId, content: $content) {
      ...CommentFields
    }
  }
`;

/**
 * Mutation to delete a comment (soft delete)
 */
export const DELETE_COMMENT = gql`
  mutation DeleteComment($commentId: String!) {
    deleteComment(commentId: $commentId)
  }
`;

/**
 * Mutation to share a post
 * Returns the share ID, updated count, and platform
 */
export const SHARE_POST = gql`
  mutation SharePost($postId: String!, $platform: String) {
    sharePost(postId: $postId, platform: $platform) {
      id
      shareCount
      platform
    }
  }
`;

/**
 * Input type for creating a poll option
 */
export interface CreatePollInput {
  question: string;
  options: string[];
  allowMultipleVotes?: boolean;
  endsAt?: string;
}

/**
 * Input type for creating a post
 */
export interface CreatePostInput {
  content: string;
  type?: string;
  mediaUrls?: string[];
  orgId?: string;
  poll?: CreatePollInput;
}

/**
 * Mutation to create a new post
 */
export const CREATE_POST = gql`
  ${POST_FRAGMENT}
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ...PostFields
    }
  }
`;

/**
 * Mutation to delete a post
 */
export const DELETE_POST = gql`
  mutation DeletePost($postId: String!) {
    deletePost(postId: $postId)
  }
`;

/**
 * Mutation to cast a vote on a poll
 */
export const CAST_VOTE = gql`
  mutation CastVote($pollId: String!, $optionId: String!) {
    castVote(pollId: $pollId, optionId: $optionId)
  }
`;

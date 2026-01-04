import { gql } from '@apollo/client';

/**
 * Fragment for user summary information
 */
export const USER_SUMMARY_FRAGMENT = gql`
  fragment UserSummaryFields on UserSummary {
    id
    firstName
    lastName
    displayName
    avatar
    email
    isLeader
    leaderLevel
  }
`;

/**
 * Fragment for organization summary information
 */
export const ORGANIZATION_SUMMARY_FRAGMENT = gql`
  fragment OrganizationSummaryFields on OrganizationSummary {
    id
    name
    logo
  }
`;

/**
 * Fragment for poll option information
 */
export const POLL_OPTION_FRAGMENT = gql`
  fragment PollOptionFields on PollOptionEntity {
    id
    pollId
    text
    voteCount
  }
`;

/**
 * Fragment for poll information
 */
export const POLL_FRAGMENT = gql`
  ${POLL_OPTION_FRAGMENT}
  fragment PollFields on PollEntity {
    id
    postId
    question
    allowMultiple
    endsAt
    createdAt
    hasVoted
    userVotedOptionId
    options {
      ...PollOptionFields
    }
  }
`;

/**
 * Fragment for post information
 */
export const POST_FRAGMENT = gql`
  ${USER_SUMMARY_FRAGMENT}
  ${ORGANIZATION_SUMMARY_FRAGMENT}
  ${POLL_FRAGMENT}
  fragment PostFields on PostEntity {
    id
    content
    type
    mediaUrls
    likeCount
    commentCount
    shareCount
    repostCount
    viewCount
    isPublished
    isLiked
    createdAt
    updatedAt
    authorId
    author {
      ...UserSummaryFields
    }
    orgId
    organization {
      ...OrganizationSummaryFields
    }
    poll {
      ...PollFields
    }
  }
`;

/**
 * Query to fetch paginated feed posts with optional location filtering
 */
export const GET_FEED = gql`
  ${POST_FRAGMENT}
  query GetFeed($limit: Float, $offset: Float, $filter: FeedFilterInput) {
    feed(limit: $limit, offset: $offset, filter: $filter) {
      ...PostFields
    }
  }
`;

/**
 * Query to fetch a single post by ID
 */
export const GET_POST = gql`
  ${POST_FRAGMENT}
  query GetPost($id: String!) {
    post(id: $id) {
      ...PostFields
    }
  }
`;

/**
 * Fragment for comment information
 */
export const COMMENT_FRAGMENT = gql`
  ${USER_SUMMARY_FRAGMENT}
  fragment CommentFields on CommentEntity {
    id
    postId
    authorId
    content
    likeCount
    replyCount
    isDeleted
    isLiked
    parentId
    totalReplies
    createdAt
    updatedAt
    author {
      ...UserSummaryFields
    }
  }
`;

/**
 * Fragment for comment with nested replies
 */
export const COMMENT_WITH_REPLIES_FRAGMENT = gql`
  ${USER_SUMMARY_FRAGMENT}
  fragment CommentWithRepliesFields on CommentEntity {
    id
    postId
    authorId
    content
    likeCount
    replyCount
    isDeleted
    isLiked
    parentId
    totalReplies
    createdAt
    updatedAt
    author {
      ...UserSummaryFields
    }
    replies {
      id
      postId
      authorId
      content
      likeCount
      replyCount
      isDeleted
      isLiked
      parentId
      createdAt
      updatedAt
      author {
        id
        firstName
        lastName
        displayName
        avatar
      }
    }
  }
`;

/**
 * Query to fetch a post with its comments
 */
export const GET_POST_WITH_COMMENTS = gql`
  ${POST_FRAGMENT}
  ${COMMENT_WITH_REPLIES_FRAGMENT}
  query GetPostWithComments($id: String!) {
    post(id: $id) {
      ...PostFields
      comments {
        ...CommentWithRepliesFields
      }
    }
  }
`;

/**
 * Query to fetch comments for a post
 */
export const GET_COMMENTS = gql`
  ${COMMENT_WITH_REPLIES_FRAGMENT}
  query GetComments($postId: String!, $limit: Float, $offset: Float) {
    comments(postId: $postId, limit: $limit, offset: $offset) {
      ...CommentWithRepliesFields
    }
  }
`;

/**
 * Query to fetch replies for a comment
 */
export const GET_REPLIES = gql`
  ${COMMENT_FRAGMENT}
  query GetReplies($commentId: String!, $limit: Float, $offset: Float) {
    replies(commentId: $commentId, limit: $limit, offset: $offset) {
      ...CommentFields
    }
  }
`;

/**
 * Query to get share text for a post with location context (for external sharing - includes marketing text)
 */
export const GET_POST_SHARE_TEXT = gql`
  query GetPostShareText($postId: String!) {
    postShareText(postId: $postId)
  }
`;

/**
 * Query to get repost text for a post (for internal repost - no marketing text)
 */
export const GET_POST_REPOST_TEXT = gql`
  query GetPostRepostText($postId: String!) {
    postRepostText(postId: $postId)
  }
`;


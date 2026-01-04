import { gql } from '@apollo/client';
import { POST_FRAGMENT } from './feed';

/**
 * Fragment for user search results
 */
export const USER_SEARCH_FRAGMENT = gql`
  fragment UserSearchFields on User {
    id
    firstName
    lastName
    displayName
    avatar
    email
    username
    bio
    isActive
  }
`;

/**
 * Query to search posts by content
 */
export const SEARCH_POSTS = gql`
  ${POST_FRAGMENT}
  query SearchPosts($query: String!, $limit: Float, $offset: Float) {
    searchPosts(query: $query, limit: $limit, offset: $offset) {
      ...PostFields
    }
  }
`;

/**
 * Query to search users
 */
export const SEARCH_USERS = gql`
  ${USER_SEARCH_FRAGMENT}
  query SearchUsers($query: String!, $limit: Float, $offset: Float) {
    searchUsers(query: $query, limit: $limit, offset: $offset) {
      ...UserSearchFields
    }
  }
`;

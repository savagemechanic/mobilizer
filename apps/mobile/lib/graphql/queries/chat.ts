import { gql } from '@apollo/client';

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

export const MESSAGE_FRAGMENT = gql`
  ${USER_SUMMARY_FRAGMENT}
  fragment MessageFields on MessageEntity {
    id
    conversationId
    senderId
    sender {
      ...UserSummaryFields
    }
    content
    mediaUrl
    isRead
    readAt
    createdAt
  }
`;

export const PARTICIPANT_FRAGMENT = gql`
  ${USER_SUMMARY_FRAGMENT}
  fragment ParticipantFields on ConversationParticipantEntity {
    id
    userId
    user {
      ...UserSummaryFields
    }
    joinedAt
    leftAt
  }
`;

export const CONVERSATION_FRAGMENT = gql`
  ${PARTICIPANT_FRAGMENT}
  ${MESSAGE_FRAGMENT}
  fragment ConversationFields on ConversationEntity {
    id
    name
    isGroup
    creatorId
    participants {
      ...ParticipantFields
    }
    messages {
      ...MessageFields
    }
    createdAt
    updatedAt
  }
`;

export const GET_CONVERSATIONS = gql`
  ${CONVERSATION_FRAGMENT}
  query GetConversations {
    conversations {
      ...ConversationFields
    }
  }
`;

export const GET_CONVERSATION = gql`
  ${PARTICIPANT_FRAGMENT}
  query GetConversation($conversationId: String!) {
    conversation(conversationId: $conversationId) {
      id
      name
      isGroup
      creatorId
      participants {
        ...ParticipantFields
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_MESSAGES = gql`
  ${MESSAGE_FRAGMENT}
  query GetMessages($conversationId: String!, $limit: Float, $offset: Float) {
    messages(conversationId: $conversationId, limit: $limit, offset: $offset) {
      ...MessageFields
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $limit: Float, $offset: Float) {
    searchUsers(query: $query, limit: $limit, offset: $offset) {
      id
      email
      firstName
      lastName
      displayName
      avatar
    }
  }
`;

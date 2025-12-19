import { gql } from '@apollo/client'

export const GET_CONVERSATIONS = gql`
  query GetConversations {
    conversations {
      id
      name
      isGroup
      creatorId
      createdAt
      updatedAt
    }
  }
`

export const GET_MESSAGES = gql`
  query GetMessages($conversationId: String!, $limit: Float, $offset: Float) {
    messages(conversationId: $conversationId, limit: $limit, offset: $offset) {
      id
      content
      senderId
      conversationId
      isRead
      readAt
      mediaUrl
      createdAt
    }
  }
`

export const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageAdded($conversationId: String!) {
    messageAdded(conversationId: $conversationId) {
      id
      content
      senderId
      conversationId
      isRead
      readAt
      mediaUrl
      createdAt
    }
  }
`

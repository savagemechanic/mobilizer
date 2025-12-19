import { gql } from '@apollo/client'

export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
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

export const CREATE_CONVERSATION = gql`
  mutation CreateConversation($participantIds: [String!]!, $name: String) {
    createConversation(participantIds: $participantIds, name: $name) {
      id
      name
      isGroup
      creatorId
      createdAt
      updatedAt
    }
  }
`

export const MARK_AS_READ = gql`
  mutation MarkAsRead($messageId: String!) {
    markAsRead(messageId: $messageId) {
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

export const MARK_CONVERSATION_AS_READ = gql`
  mutation MarkConversationAsRead($conversationId: String!) {
    markConversationAsRead(conversationId: $conversationId)
  }
`

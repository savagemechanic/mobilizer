import { gql } from '@apollo/client';
import { MESSAGE_FRAGMENT, CONVERSATION_FRAGMENT } from '../queries/chat';

export const SEND_MESSAGE = gql`
  ${MESSAGE_FRAGMENT}
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      ...MessageFields
    }
  }
`;

export const CREATE_CONVERSATION = gql`
  ${CONVERSATION_FRAGMENT}
  mutation CreateConversation($participantIds: [String!]!, $name: String) {
    createConversation(participantIds: $participantIds, name: $name) {
      ...ConversationFields
    }
  }
`;

export const MARK_AS_READ = gql`
  ${MESSAGE_FRAGMENT}
  mutation MarkAsRead($messageId: String!) {
    markAsRead(messageId: $messageId) {
      ...MessageFields
    }
  }
`;

export const MARK_CONVERSATION_AS_READ = gql`
  mutation MarkConversationAsRead($conversationId: String!) {
    markConversationAsRead(conversationId: $conversationId)
  }
`;

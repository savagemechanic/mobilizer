import { useQuery, useMutation, useSubscription } from '@apollo/client'
import { GET_MESSAGES, MESSAGE_SUBSCRIPTION } from '@/lib/graphql/queries/chat'
import { SEND_MESSAGE } from '@/lib/graphql/mutations/chat'

interface UseMessagesProps {
  conversationId: string
  limit?: number
  offset?: number
}

export function useMessages({
  conversationId,
  limit = 50,
  offset = 0,
}: UseMessagesProps) {
  const { data, loading, error, refetch } = useQuery(GET_MESSAGES, {
    variables: { conversationId, limit, offset },
  })

  const [sendMessageMutation, { loading: sending }] = useMutation(SEND_MESSAGE, {
    refetchQueries: [
      {
        query: GET_MESSAGES,
        variables: { conversationId, limit, offset },
      },
    ],
  })

  const { data: subscriptionData } = useSubscription(MESSAGE_SUBSCRIPTION, {
    variables: { conversationId },
  })

  const sendMessage = async (content: string) => {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty')
    }

    try {
      const result = await sendMessageMutation({
        variables: {
          input: {
            conversationId,
            content,
          },
        },
      })
      return result.data
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }

  return {
    messages: data?.messages?.messages || [],
    loading,
    error,
    sending,
    sendMessage,
    refetch,
    newMessage: subscriptionData?.messageAdded,
  }
}

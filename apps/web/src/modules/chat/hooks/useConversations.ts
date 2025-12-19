import { useQuery } from '@apollo/client'
import { GET_CONVERSATIONS } from '@/lib/graphql/queries/chat'
import { useAuthStore } from '@/store/auth-store'
import type { Conversation } from '@/types'

interface UseConversationsProps {
  limit?: number
  offset?: number
}

export function useConversations({
  limit = 20,
  offset = 0,
}: UseConversationsProps = {}) {
  const currentUser = useAuthStore((state) => state.user)

  const { data, loading, error, refetch } = useQuery(GET_CONVERSATIONS, {
    variables: { limit, offset },
  })

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.id !== currentUser?.id)
  }

  return {
    conversations: data?.conversations || [],
    loading,
    error,
    refetch,
    getOtherParticipant,
  }
}

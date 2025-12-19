'use client'

import { use } from 'react'
import { useQuery } from '@apollo/client'
import { GET_CONVERSATIONS } from '@/lib/graphql/queries/chat'
import { ChatList, ChatWindow } from '@/modules/chat'

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, loading } = useQuery(GET_CONVERSATIONS)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <div className="flex-1 bg-background border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            <ChatList conversations={data?.conversations || []} />
            <div className="md:col-span-2">
              <ChatWindow conversationId={id} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

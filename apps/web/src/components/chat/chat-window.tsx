'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useSubscription } from '@apollo/client'
import { Send } from 'lucide-react'
import { GET_MESSAGES, MESSAGE_SUBSCRIPTION } from '@/lib/graphql/queries/chat'
import { SEND_MESSAGE } from '@/lib/graphql/mutations/chat'
import { useAuthStore } from '@/store/auth-store'
import { MessageBubble } from './message-bubble'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import type { Message } from '@/types'

interface ChatWindowProps {
  conversationId: string
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUser = useAuthStore((state) => state.user)

  const { data, loading } = useQuery(GET_MESSAGES, {
    variables: { conversationId, limit: 50, offset: 0 },
  })

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    refetchQueries: [
      {
        query: GET_MESSAGES,
        variables: { conversationId, limit: 50, offset: 0 },
      },
    ],
  })

  useSubscription(MESSAGE_SUBSCRIPTION, {
    variables: { conversationId },
    onData: ({ data }) => {
      if (data.data?.messageAdded) {
        scrollToBottom()
      }
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [data])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    try {
      await sendMessage({
        variables: {
          conversationId,
          content: message,
        },
      })
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {data?.messages?.messages.map((msg: Message) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender.id === currentUser?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

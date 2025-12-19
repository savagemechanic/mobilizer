'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import type { Conversation } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'

interface ChatListProps {
  conversations: Conversation[]
}

export function ChatList({ conversations }: ChatListProps) {
  const pathname = usePathname()
  const currentUser = useAuthStore((state) => state.user)

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.id !== currentUser?.id)
  }

  return (
    <div className="flex flex-col border-r h-full overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Messages</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const otherUser = getOtherParticipant(conversation)
          const isActive = pathname === `/messages/${conversation.id}`

          return (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className={cn(
                'flex items-start gap-3 p-4 border-b hover:bg-accent transition-colors',
                isActive && 'bg-accent'
              )}
            >
              <Avatar>
                <AvatarImage src={otherUser?.avatar} />
                <AvatarFallback>
                  {otherUser ? `${otherUser.firstName?.[0]}${otherUser.lastName?.[0]}` : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="font-medium truncate">
                    {otherUser?.firstName} {otherUser?.lastName}
                  </p>
                  {conversation.lastMessage && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt))}
                    </span>
                  )}
                </div>
                {conversation.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage.content}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

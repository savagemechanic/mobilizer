'use client'

import { format } from 'date-fns'
import type { Message } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.sender.avatar} />
        <AvatarFallback>
          {`${message.sender.firstName?.[0]}${message.sender.lastName?.[0]}`.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={cn('flex flex-col', isOwn && 'items-end')}>
        <div
          className={cn(
            'max-w-md rounded-lg px-4 py-2',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          <p>{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {format(new Date(message.createdAt), 'p')}
        </span>
      </div>
    </div>
  )
}

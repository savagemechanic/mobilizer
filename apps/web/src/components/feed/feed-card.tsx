'use client'

import { useMutation } from '@apollo/client'
import { Heart, MessageCircle, MoreVertical } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { LIKE_POST, UNLIKE_POST } from '@/lib/graphql/mutations/posts'
import type { Post } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Card, CardContent, CardFooter, CardHeader } from '@/ui/card'
import { Button } from '@/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

interface FeedCardProps {
  post: Post
}

export function FeedCard({ post }: FeedCardProps) {
  const [likePost] = useMutation(LIKE_POST)
  const [unlikePost] = useMutation(UNLIKE_POST)

  const handleLike = async () => {
    try {
      if (post.liked) {
        await unlikePost({ variables: { postId: post.id } })
      } else {
        await likePost({ variables: { postId: post.id } })
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error)
    }
  }

  const getInitials = () => {
    const first = post.author.firstName?.[0] || ''
    const last = post.author.lastName?.[0] || ''
    return `${first}${last}`.toUpperCase() || 'U'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">
              {post.author.displayName || `${post.author.firstName} ${post.author.lastName}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt))} ago
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Report</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      <CardFooter className="flex gap-4 border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleLike}
        >
          <Heart
            className={`h-4 w-4 ${post.liked ? 'fill-red-500 text-red-500' : ''}`}
          />
          <span>{post.likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}

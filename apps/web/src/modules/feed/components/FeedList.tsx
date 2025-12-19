'use client'

import type { Post } from '@/types'
import { FeedCard } from './FeedCard'

interface FeedListProps {
  posts: Post[]
  loading?: boolean
  error?: Error | null
}

export function FeedList({ posts, loading, error }: FeedListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
        <p className="text-red-600">Failed to load posts</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No posts yet. Be the first to post!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} />
      ))}
    </div>
  )
}

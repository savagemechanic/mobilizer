'use client'

import { PostCreator, FeedList } from '@/modules/feed'
import { usePosts } from '@/modules/feed'

export default function FeedsPage() {
  const { posts, loading, error } = usePosts()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Feeds</h1>

      <PostCreator />

      <FeedList posts={posts} loading={loading} error={error} />
    </div>
  )
}

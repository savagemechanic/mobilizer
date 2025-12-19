import { useQuery } from '@apollo/client'
import { GET_FEED } from '@/lib/graphql/queries/posts'
import type { Post } from '@/types'

interface FeedData {
  feed: {
    posts: Post[]
    total: number
  }
}

interface UsePostsOptions {
  limit?: number
  offset?: number
}

export function usePosts({ limit = 20, offset = 0 }: UsePostsOptions = {}) {
  const { data, loading, error, refetch, fetchMore } = useQuery<FeedData>(GET_FEED, {
    variables: { limit, offset },
  })

  const posts = data?.feed?.posts || []
  const total = data?.feed?.total || 0

  const loadMore = async () => {
    if (!loading && posts.length < total) {
      await fetchMore({
        variables: {
          offset: posts.length,
          limit,
        },
      })
    }
  }

  return {
    posts,
    total,
    loading,
    error,
    refetch,
    loadMore,
    hasMore: posts.length < total,
  }
}

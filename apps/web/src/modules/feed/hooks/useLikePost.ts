import { useMutation } from '@apollo/client'
import { LIKE_POST, UNLIKE_POST } from '@/lib/graphql/mutations/posts'

export function useLikePost(postId: string, isLiked: boolean) {
  const [likePost, { loading: likingPost }] = useMutation(LIKE_POST)
  const [unlikePost, { loading: unlikingPost }] = useMutation(UNLIKE_POST)

  const handleLike = async () => {
    try {
      if (isLiked) {
        await unlikePost({
          variables: { postId },
          optimisticResponse: {
            unlikePost: {
              __typename: 'Post',
              id: postId,
              liked: false,
              likes: -1, // This will be corrected by the actual response
            },
          },
        })
      } else {
        await likePost({
          variables: { postId },
          optimisticResponse: {
            likePost: {
              __typename: 'Post',
              id: postId,
              liked: true,
              likes: 1, // This will be corrected by the actual response
            },
          },
        })
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error)
    }
  }

  return {
    handleLike,
    loading: likingPost || unlikingPost,
  }
}

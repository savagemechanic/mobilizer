import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { CREATE_POST } from '@/lib/graphql/mutations/posts'
import { GET_FEED } from '@/lib/graphql/queries/posts'

export function useCreatePost() {
  const [content, setContent] = useState('')

  const [createPost, { loading }] = useMutation(CREATE_POST, {
    refetchQueries: [{ query: GET_FEED, variables: { limit: 20, offset: 0 } }],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      await createPost({
        variables: { content },
      })
      setContent('')
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  return {
    content,
    setContent,
    handleSubmit,
    loading,
  }
}

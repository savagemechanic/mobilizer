'use client'

import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { CREATE_POST } from '@/lib/graphql/mutations/posts'
import { GET_FEED } from '@/lib/graphql/queries/posts'
import { useAuthStore } from '@/store/auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Button } from '@/ui/button'
import { Card, CardContent } from '@/ui/card'

export function PostCreator() {
  const [content, setContent] = useState('')
  const user = useAuthStore((state) => state.user)

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

  const getInitials = () => {
    if (!user) return 'U'
    const first = user.firstName?.[0] || ''
    const last = user.lastName?.[0] || ''
    return `${first}${last}`.toUpperCase() || 'U'
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex justify-end mt-3">
                <Button type="submit" disabled={loading || !content.trim()}>
                  {loading ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

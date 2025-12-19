'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { GET_ALL_POSTS } from '@/lib/graphql/queries/admin'
import { GET_SUPPORT_GROUPS } from '@/lib/graphql/queries/admin'
import { DELETE_POST } from '@/lib/graphql/mutations/posts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { MoreVertical, Trash2, Eye, ThumbsUp, MessageSquare, Share2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { ConfirmDialog } from '@/modals'

interface Post {
  id: string
  content: string
  author: {
    id: string
    firstName: string
    lastName: string
    displayName: string
    avatar: string
  }
  organizationId?: string
  likes: number
  comments: number
  liked?: boolean
  createdAt: string
  updatedAt: string
}

interface Organization {
  id: string
  name: string
  logo: string
}

export default function AdminPostsPage() {
  const { user } = useAuthStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const postsPerPage = 20

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    postId: string | null
  }>({
    open: false,
    postId: null,
  })

  // Fetch support groups for filter
  const { data: orgsData } = useQuery(GET_SUPPORT_GROUPS, {
    variables: {
      movementId: user?.roles?.[0]?.movementId || '',
      limit: 100,
      offset: 0,
    },
    skip: !user?.roles?.[0]?.movementId,
  })

  // Fetch posts
  const { data, loading, error, refetch } = useQuery(GET_ALL_POSTS, {
    variables: {
      limit: postsPerPage,
      offset: (currentPage - 1) * postsPerPage,
      organizationId: selectedOrg !== 'all' ? selectedOrg : undefined,
    },
    fetchPolicy: 'network-only',
  })

  // Delete post mutation
  const [deletePost] = useMutation(DELETE_POST, {
    onCompleted: () => {
      refetch()
    },
    onError: (error) => {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    },
  })

  const handleDeleteClick = (postId: string) => {
    setConfirmDialog({
      open: true,
      postId,
    })
  }

  const handleConfirmDelete = async () => {
    if (confirmDialog.postId) {
      try {
        await deletePost({ variables: { postId: confirmDialog.postId } })
        setConfirmDialog({ open: false, postId: null })
      } catch (error) {
        console.error('Delete error:', error)
      }
    }
  }

  const posts: Post[] = data?.feed?.posts || []
  const totalPosts = data?.feed?.total || 0
  const totalPages = Math.ceil(totalPosts / postsPerPage)
  const organizations: Organization[] = orgsData?.organizations || []

  // Filter posts by search term (client-side for now)
  const filteredPosts = posts.filter((post) => {
    const searchLower = searchTerm.toLowerCase()
    const contentMatch = post.content.toLowerCase().includes(searchLower)
    const authorMatch = `${post.author.firstName} ${post.author.lastName}`
      .toLowerCase()
      .includes(searchLower)
    return contentMatch || authorMatch
  })

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Posts Management</h1>
        <div className="text-sm text-muted-foreground">
          Total Posts: {totalPosts}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>All Posts</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Input
                placeholder="Search posts or authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>Error loading posts: {error.message}</p>
              <Button onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No posts found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Author</th>
                      <th className="text-left p-3 font-medium">Content</th>
                      <th className="text-left p-3 font-medium hidden lg:table-cell">
                        Engagement
                      </th>
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={post.author.avatar} />
                              <AvatarFallback>
                                {`${post.author.firstName?.[0]}${post.author.lastName?.[0]}`.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {post.author.firstName} {post.author.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                @{post.author.displayName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-sm line-clamp-2 max-w-md">
                            {truncateContent(post.content, 150)}
                          </p>
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{post.comments}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(post.createdAt)}
                          </p>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => window.open(`/posts/${post.id}`, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Post
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(post.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Post
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * postsPerPage + 1} to{' '}
                    {Math.min(currentPage * postsPerPage, totalPosts)} of {totalPosts} posts
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, postId: null })}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

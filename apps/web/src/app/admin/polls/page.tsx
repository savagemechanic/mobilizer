'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import Link from 'next/link'
import { BarChart3, Search, Filter, Eye, Trash2, Plus } from 'lucide-react'
import { GET_POLLS } from '@/lib/graphql/queries/posts'
import { GET_SUPPORT_GROUPS } from '@/lib/graphql/queries/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { Progress } from '@/ui/progress'

interface PollOption {
  id: string
  pollId: string
  text: string
  voteCount: number
}

interface Poll {
  id: string
  postId: string
  question: string
  endsAt?: string
  allowMultiple: boolean
  createdAt: string
  options: PollOption[]
}

interface Post {
  id: string
  content: string
  type: string
  authorId: string
  orgId?: string
  isPublished: boolean
  createdAt: string
  updatedAt?: string
  author: {
    id: string
    firstName: string
    lastName: string
    displayName?: string
    avatar?: string
  }
  organization?: {
    id: string
    name: string
    logo?: string
  }
  poll: Poll
}

interface Organization {
  id: string
  name: string
  level: string
}

export default function PollsPage() {
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const pageSize = 20

  // Query polls
  const { data: pollsData, loading: pollsLoading, error: pollsError, refetch } = useQuery(GET_POLLS, {
    variables: {
      limit: pageSize,
      offset: page * pageSize,
      organizationId: selectedOrg === 'all' ? undefined : selectedOrg,
    },
  })

  // Query organizations for filter
  const { data: orgsData } = useQuery(GET_SUPPORT_GROUPS, {
    variables: {
      movementId: typeof window !== 'undefined' ? localStorage.getItem('currentMovementId') : null,
      limit: 100,
      offset: 0,
    },
    skip: typeof window === 'undefined',
  })

  const polls: Post[] = pollsData?.polls || []
  const organizations: Organization[] = orgsData?.organizations || []

  // Client-side filtering
  const filteredPolls = polls.filter((poll) => {
    // Search filter
    if (searchTerm && !poll.poll?.question?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Status filter
    if (statusFilter === 'active') {
      return !poll.poll?.endsAt || new Date(poll.poll.endsAt) >= new Date()
    } else if (statusFilter === 'ended') {
      return poll.poll?.endsAt && new Date(poll.poll.endsAt) < new Date()
    } else if (statusFilter === 'draft') {
      return !poll.isPublished
    }

    return true
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTotalVotes = (options: PollOption[]) => {
    return options.reduce((sum, option) => sum + option.voteCount, 0)
  }

  const getStatusBadge = (poll: Poll) => {
    if (!poll.endsAt) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">No Expiry</span>
    }

    const endDate = new Date(poll.endsAt)
    const now = new Date()

    if (endDate < now) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Ended</span>
    }

    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>
  }

  const handleDelete = (pollId: string) => {
    if (confirm('Are you sure you want to delete this poll?')) {
      // TODO: Implement delete mutation
      console.log('Delete poll:', pollId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Polls</h1>
          <p className="text-muted-foreground">Create and manage polls for your movement</p>
        </div>
        <Link href="/admin/polls/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Poll
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>All Polls</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {filteredPolls.length} poll{filteredPolls.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search polls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              {/* Organization filter */}
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Organization" />
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
          {pollsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pollsError ? (
            <div className="text-center py-12">
              <p className="text-red-500">Error loading polls: {pollsError.message}</p>
              <Button onClick={() => refetch()} className="mt-4" variant="outline">
                Retry
              </Button>
            </div>
          ) : filteredPolls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No polls found</p>
              {(searchTerm || selectedOrg !== 'all' || statusFilter !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedOrg('all')
                    setStatusFilter('all')
                  }}
                  variant="link"
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Question</th>
                      <th className="text-left p-3 font-semibold">Options</th>
                      <th className="text-left p-3 font-semibold">Total Votes</th>
                      <th className="text-left p-3 font-semibold">Created By</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-right p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPolls.map((post) => {
                      const poll = post.poll
                      if (!poll) return null

                      const totalVotes = getTotalVotes(poll.options)

                      return (
                        <tr key={post.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="min-w-[200px]">
                              <p className="font-medium">{poll.question}</p>
                              {post.organization && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {post.organization.name}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-2 min-w-[250px]">
                              {poll.options.slice(0, 2).map((option) => {
                                const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0
                                return (
                                  <div key={option.id} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="truncate max-w-[150px]">{option.text}</span>
                                      <span className="text-muted-foreground">
                                        {option.voteCount} ({percentage.toFixed(0)}%)
                                      </span>
                                    </div>
                                    <Progress value={percentage} className="h-1" />
                                  </div>
                                )
                              })}
                              {poll.options.length > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{poll.options.length - 2} more option{poll.options.length - 2 !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-medium">{totalVotes}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {post.author.avatar && (
                                <img
                                  src={post.author.avatar}
                                  alt={`${post.author.firstName} ${post.author.lastName}`}
                                  className="w-6 h-6 rounded-full"
                                />
                              )}
                              <span className="text-sm truncate max-w-[120px]">
                                {post.author.displayName || `${post.author.firstName} ${post.author.lastName}`}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-sm whitespace-nowrap">{formatDate(post.createdAt)}</span>
                          </td>
                          <td className="p-3">{getStatusBadge(poll)}</td>
                          <td className="p-3">
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/admin/polls/${post.id}`}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Results
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(post.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {polls.length >= pageSize && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, page * pageSize + polls.length)} polls
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={polls.length < pageSize}
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
    </div>
  )
}

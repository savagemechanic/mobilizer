'use client'

import { use, useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserCheck, UserX, Crown, Shield, Mail, Phone, MapPin, Briefcase, MessageSquare, Heart, Share2, Calendar } from 'lucide-react'
import { GET_USER, GET_USER_MEMBERSHIPS } from '@/lib/graphql/queries/users'
import { GET_ORG_MEMBERS, GET_ALL_POSTS } from '@/lib/graphql/queries/admin'
import {
  BLOCK_MEMBER,
  UNBLOCK_MEMBER,
  MAKE_LEADER,
  REMOVE_LEADER,
  MAKE_CHAIRMAN,
  REMOVE_CHAIRMAN,
} from '@/lib/graphql/mutations/organizations'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/badge'
import { Label } from '@/ui/label'
import { Input } from '@/ui/input'
import { Textarea } from '@/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  GET_STATES,
  GET_LGAS,
  GET_WARDS,
  GET_POLLING_UNITS,
} from '@/lib/graphql/queries/locations'

export default function AdminMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  // Dialog states
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [showLeaderDialog, setShowLeaderDialog] = useState(false)
  const [blockReason, setBlockReason] = useState('')

  // Leader assignment state
  const [leaderLevel, setLeaderLevel] = useState<string>('')
  const [leaderStateId, setLeaderStateId] = useState<string>('')
  const [leaderLgaId, setLeaderLgaId] = useState<string>('')
  const [leaderWardId, setLeaderWardId] = useState<string>('')
  const [leaderPollingUnitId, setLeaderPollingUnitId] = useState<string>('')
  const [selectedMembershipId, setSelectedMembershipId] = useState<string>('')

  // Posts pagination state
  const [postsPage, setPostsPage] = useState(0)
  const postsPerPage = 20

  // Fetch user data
  const { data, loading, error, refetch } = useQuery(GET_USER, {
    variables: { id },
  })

  // Fetch user memberships
  const { data: membershipsData, loading: membershipsLoading, refetch: refetchMemberships } = useQuery(GET_USER_MEMBERSHIPS, {
    variables: { userId: id },
  })

  // Fetch user posts
  const { data: postsData, loading: postsLoading } = useQuery(GET_ALL_POSTS, {
    variables: {
      limit: postsPerPage,
      offset: postsPage * postsPerPage,
      filter: { authorId: id },
    },
  })

  // Fetch location data for leader assignment
  const { data: statesData } = useQuery(GET_STATES, {
    variables: { countryId: null },
  })
  const { data: lgasData } = useQuery(GET_LGAS, {
    variables: { stateId: leaderStateId || undefined },
    skip: !leaderStateId,
  })
  const { data: wardsData } = useQuery(GET_WARDS, {
    variables: { lgaId: leaderLgaId || undefined },
    skip: !leaderLgaId,
  })
  const { data: pollingUnitsData } = useQuery(GET_POLLING_UNITS, {
    variables: { wardId: leaderWardId || undefined },
    skip: !leaderWardId,
  })

  const states = statesData?.states || []
  const lgas = lgasData?.lgas || []
  const wards = wardsData?.wards || []
  const pollingUnits = pollingUnitsData?.pollingUnits || []

  // Mutations
  const [blockMember, { loading: blocking }] = useMutation(BLOCK_MEMBER, {
    onCompleted: () => {
      toast({
        title: 'Member blocked',
        description: 'The member has been successfully blocked.',
      })
      setShowBlockDialog(false)
      setBlockReason('')
      refetchMemberships()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to block member',
        variant: 'destructive',
      })
    },
  })

  const [unblockMember, { loading: unblocking }] = useMutation(UNBLOCK_MEMBER, {
    onCompleted: () => {
      toast({
        title: 'Member unblocked',
        description: 'The member has been successfully unblocked.',
      })
      refetchMemberships()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unblock member',
        variant: 'destructive',
      })
    },
  })

  const [makeLeader, { loading: makingLeader }] = useMutation(MAKE_LEADER, {
    onCompleted: () => {
      toast({
        title: 'Leader assigned',
        description: 'The member has been successfully assigned as a leader.',
      })
      setShowLeaderDialog(false)
      resetLeaderForm()
      refetchMemberships()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign leader',
        variant: 'destructive',
      })
    },
  })

  const [removeLeader, { loading: removingLeader }] = useMutation(REMOVE_LEADER, {
    onCompleted: () => {
      toast({
        title: 'Leader removed',
        description: 'The member has been removed as a leader.',
      })
      refetchMemberships()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove leader',
        variant: 'destructive',
      })
    },
  })

  const [makeChairman, { loading: makingChairman }] = useMutation(MAKE_CHAIRMAN, {
    onCompleted: () => {
      toast({
        title: 'Chairman assigned',
        description: 'The member has been successfully assigned as chairman.',
      })
      refetchMemberships()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign chairman',
        variant: 'destructive',
      })
    },
  })

  const [removeChairman, { loading: removingChairman }] = useMutation(REMOVE_CHAIRMAN, {
    onCompleted: () => {
      toast({
        title: 'Chairman removed',
        description: 'The member has been removed as chairman.',
      })
      refetchMemberships()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove chairman',
        variant: 'destructive',
      })
    },
  })

  const resetLeaderForm = () => {
    setLeaderLevel('')
    setLeaderStateId('')
    setLeaderLgaId('')
    setLeaderWardId('')
    setLeaderPollingUnitId('')
    setSelectedMembershipId('')
  }

  const handleBlock = async (membershipId: string) => {
    if (!blockReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for blocking',
        variant: 'destructive',
      })
      return
    }

    await blockMember({
      variables: {
        membershipId,
        reason: blockReason,
      },
    })
  }

  const handleUnblock = async (membershipId: string) => {
    await unblockMember({
      variables: { membershipId },
    })
  }

  const handleMakeLeader = async () => {
    if (!leaderLevel) {
      toast({
        title: 'Error',
        description: 'Please select a leader level',
        variant: 'destructive',
      })
      return
    }

    const input: any = {
      membershipId: selectedMembershipId,
      leaderLevel,
    }

    if (leaderLevel === 'STATE' && leaderStateId) {
      input.leaderStateId = leaderStateId
    } else if (leaderLevel === 'LGA' && leaderLgaId) {
      input.leaderLgaId = leaderLgaId
    } else if (leaderLevel === 'WARD' && leaderWardId) {
      input.leaderWardId = leaderWardId
    } else if (leaderLevel === 'POLLING_UNIT' && leaderPollingUnitId) {
      input.leaderPollingUnitId = leaderPollingUnitId
    }

    await makeLeader({ variables: { input } })
  }

  const openLeaderDialog = (membershipId: string) => {
    setSelectedMembershipId(membershipId)
    setShowLeaderDialog(true)
  }

  const openBlockDialog = (membershipId: string) => {
    setSelectedMembershipId(membershipId)
    setShowBlockDialog(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !data?.user) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
        <p className="text-red-600">Failed to load user</p>
      </div>
    )
  }

  const user = data.user
  const memberships = membershipsData?.userMemberships || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/members')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Member Details</h1>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-2xl">
                {`${user.firstName?.[0]}${user.lastName?.[0]}`.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-2xl">
                  {user.firstName} {user.middleName} {user.lastName}
                </CardTitle>
                {user.isPlatformAdmin && (
                  <Badge variant="default">
                    <Shield className="h-3 w-3 mr-1" />
                    Platform Admin
                  </Badge>
                )}
              </div>
              {user.displayName && (
                <p className="text-muted-foreground">@{user.displayName}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Email</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>

            {user.phoneNumber && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Phone</div>
                  <div className="text-sm text-muted-foreground">{user.phoneNumber}</div>
                </div>
              </div>
            )}
          </div>

          {user.bio && (
            <div>
              <h3 className="font-semibold mb-2">Bio</h3>
              <p className="text-muted-foreground">{user.bio}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Organization Memberships */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Memberships</CardTitle>
        </CardHeader>
        <CardContent>
          {membershipsLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : memberships.length === 0 ? (
            <p className="text-muted-foreground text-sm">No organization memberships</p>
          ) : (
            <div className="space-y-4">
              {memberships.map((membership: any) => (
                <Card key={membership.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        {membership.organization?.logo && (
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={membership.organization.logo} />
                            <AvatarFallback>
                              {membership.organization.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{membership.organization?.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {membership.organization?.level}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {membership.isBlocked ? (
                              <Badge variant="destructive">Blocked</Badge>
                            ) : membership.isActive ? (
                              <Badge variant="default" className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {membership.isAdmin && <Badge variant="default">Admin</Badge>}
                            {membership.isLeader && (
                              <Badge variant="secondary">
                                <Crown className="h-3 w-3 mr-1" />
                                Leader ({membership.leaderLevel})
                              </Badge>
                            )}
                            {membership.isChairman && <Badge variant="secondary">Chairman</Badge>}
                            {membership.isVerified && <Badge variant="outline">Verified</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Joined {new Date(membership.joinedAt).toLocaleDateString()}
                          </p>
                          {membership.isBlocked && membership.blockedReason && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                              <p className="text-xs text-red-600">
                                <strong>Block Reason:</strong> {membership.blockedReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {membership.isBlocked ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnblock(membership.id)}
                            disabled={unblocking}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            {unblocking ? 'Unblocking...' : 'Unblock'}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBlockDialog(membership.id)}
                            disabled={membership.isPlatformAdmin}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Block
                          </Button>
                        )}

                        {membership.isLeader ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeLeader({ variables: { membershipId: membership.id } })}
                            disabled={removingLeader}
                          >
                            Remove Leader
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openLeaderDialog(membership.id)}
                          >
                            <Crown className="h-4 w-4 mr-1" />
                            Make Leader
                          </Button>
                        )}

                        {membership.isChairman ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeChairman({ variables: { membershipId: membership.id } })}
                            disabled={removingChairman}
                          >
                            Remove Chairman
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => makeChairman({ variables: { membershipId: membership.id } })}
                            disabled={makingChairman}
                          >
                            Make Chairman
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member's Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Member's Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : !postsData?.feed || postsData.feed.length === 0 ? (
            <p className="text-muted-foreground text-sm">No posts yet</p>
          ) : (
            <div className="space-y-4">
              {postsData.feed.map((post: any) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Post Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author?.avatar} />
                            <AvatarFallback>
                              {`${post.author?.firstName?.[0]}${post.author?.lastName?.[0]}`.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">
                                {post.author?.firstName} {post.author?.lastName}
                              </p>
                              {post.organization && (
                                <>
                                  <span className="text-muted-foreground">in</span>
                                  <div className="flex items-center gap-1">
                                    {post.organization.logo && (
                                      <Avatar className="h-4 w-4">
                                        <AvatarImage src={post.organization.logo} />
                                      </Avatar>
                                    )}
                                    <span className="text-sm font-medium">{post.organization.name}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(post.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {post.type}
                        </Badge>
                      </div>

                      {/* Post Content */}
                      <div className="pl-13">
                        <p className="text-sm whitespace-pre-wrap">{post.content}</p>

                        {/* Media */}
                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                          <div className="mt-3 grid gap-2 grid-cols-2">
                            {post.mediaUrls.map((url: string, idx: number) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Media ${idx + 1}`}
                                className="rounded-md w-full h-48 object-cover"
                              />
                            ))}
                          </div>
                        )}

                        {/* Poll */}
                        {post.poll && (
                          <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
                            <p className="font-medium text-sm">{post.poll.question}</p>
                            <div className="space-y-1">
                              {post.poll.options.map((option: any) => (
                                <div key={option.id} className="flex items-center justify-between p-2 bg-background rounded">
                                  <span className="text-sm">{option.text}</span>
                                  <Badge variant="secondary">{option.voteCount} votes</Badge>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Ends: {new Date(post.poll.endsAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {/* Engagement Stats */}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Heart className="h-4 w-4" />
                            <span className="text-sm">{post.likeCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-sm">{post.commentCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Share2 className="h-4 w-4" />
                            <span className="text-sm">{post.shareCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPostsPage(prev => Math.max(0, prev - 1))}
                  disabled={postsPage === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {postsPage + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPostsPage(prev => prev + 1)}
                  disabled={!postsData?.feed || postsData.feed.length < postsPerPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block Member Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to block this member? Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for blocking</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Violation of community guidelines"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBlockDialog(false)
                setBlockReason('')
              }}
              disabled={blocking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleBlock(selectedMembershipId)}
              disabled={blocking}
            >
              {blocking ? 'Blocking...' : 'Block Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Make Leader Dialog */}
      <Dialog open={showLeaderDialog} onOpenChange={setShowLeaderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign as Leader</DialogTitle>
            <DialogDescription>
              Select the leadership level and location for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Leader Level</Label>
              <Select value={leaderLevel} onValueChange={setLeaderLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIONAL">National</SelectItem>
                  <SelectItem value="STATE">State</SelectItem>
                  <SelectItem value="LGA">LGA</SelectItem>
                  <SelectItem value="WARD">Ward</SelectItem>
                  <SelectItem value="POLLING_UNIT">Polling Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {leaderLevel === 'STATE' && (
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={leaderStateId} onValueChange={setLeaderStateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state: any) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {leaderLevel === 'LGA' && (
              <>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={leaderStateId} onValueChange={setLeaderStateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state: any) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>LGA</Label>
                  <Select value={leaderLgaId} onValueChange={setLeaderLgaId} disabled={!leaderStateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {lgas.map((lga: any) => (
                        <SelectItem key={lga.id} value={lga.id}>
                          {lga.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {leaderLevel === 'WARD' && (
              <>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={leaderStateId} onValueChange={setLeaderStateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state: any) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>LGA</Label>
                  <Select value={leaderLgaId} onValueChange={setLeaderLgaId} disabled={!leaderStateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {lgas.map((lga: any) => (
                        <SelectItem key={lga.id} value={lga.id}>
                          {lga.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ward</Label>
                  <Select value={leaderWardId} onValueChange={setLeaderWardId} disabled={!leaderLgaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((ward: any) => (
                        <SelectItem key={ward.id} value={ward.id}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {leaderLevel === 'POLLING_UNIT' && (
              <>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={leaderStateId} onValueChange={setLeaderStateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state: any) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>LGA</Label>
                  <Select value={leaderLgaId} onValueChange={setLeaderLgaId} disabled={!leaderStateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {lgas.map((lga: any) => (
                        <SelectItem key={lga.id} value={lga.id}>
                          {lga.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ward</Label>
                  <Select value={leaderWardId} onValueChange={setLeaderWardId} disabled={!leaderLgaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((ward: any) => (
                        <SelectItem key={ward.id} value={ward.id}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Polling Unit</Label>
                  <Select value={leaderPollingUnitId} onValueChange={setLeaderPollingUnitId} disabled={!leaderWardId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select polling unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {pollingUnits.map((pu: any) => (
                        <SelectItem key={pu.id} value={pu.id}>
                          {pu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLeaderDialog(false)
                resetLeaderForm()
              }}
              disabled={makingLeader}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMakeLeader}
              disabled={makingLeader}
            >
              {makingLeader ? 'Assigning...' : 'Assign Leader'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

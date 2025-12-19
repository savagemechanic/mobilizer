'use client'

import { use, useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { GET_USER, GET_USER_MEMBERSHIPS } from '@/lib/graphql/queries/users'
import { SUSPEND_USER, UNSUSPEND_USER } from '@/lib/graphql/mutations/platform-admin'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'

export default function AdminMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')

  const { data, loading, error, refetch } = useQuery(GET_USER, {
    variables: { id },
  })

  const { data: membershipsData, loading: membershipsLoading } = useQuery(GET_USER_MEMBERSHIPS, {
    variables: { userId: id },
  })

  const [suspendUser, { loading: suspending }] = useMutation(SUSPEND_USER, {
    onCompleted: () => {
      toast({
        title: 'User suspended',
        description: 'The user has been successfully suspended.',
        variant: 'default',
      })
      setShowSuspendDialog(false)
      setSuspendReason('')
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to suspend user',
        variant: 'destructive',
      })
    },
  })

  const [unsuspendUser, { loading: unsuspending }] = useMutation(UNSUSPEND_USER, {
    onCompleted: () => {
      toast({
        title: 'User unsuspended',
        description: 'The user has been successfully unsuspended.',
        variant: 'success',
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unsuspend user',
        variant: 'destructive',
      })
    },
  })

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for suspension',
        variant: 'destructive',
      })
      return
    }

    await suspendUser({
      variables: {
        userId: id,
        reason: suspendReason,
      },
    })
  }

  const handleUnsuspend = async () => {
    await unsuspendUser({
      variables: {
        userId: id,
      },
    })
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/members')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Member Details</h1>
        </div>
        <div className="flex gap-2">
          {user.isSuspended ? (
            <Button
              variant="outline"
              onClick={handleUnsuspend}
              disabled={unsuspending}
            >
              {unsuspending ? 'Unsuspending...' : 'Unsuspend'}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowSuspendDialog(true)}
              disabled={user.isPlatformAdmin}
            >
              Suspend
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-xl">
                {`${user.firstName?.[0]}${user.lastName?.[0]}`.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle>
                  {user.firstName} {user.lastName}
                </CardTitle>
                {user.isPlatformAdmin && (
                  <Badge variant="default">Platform Admin</Badge>
                )}
                {user.isSuspended ? (
                  <Badge variant="destructive">Suspended</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{user.displayName}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Email</h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          {user.bio && (
            <div>
              <h3 className="font-semibold mb-2">Bio</h3>
              <p className="text-muted-foreground">{user.bio}</p>
            </div>
          )}
          {user.isSuspended && user.suspendedReason && (
            <div>
              <h3 className="font-semibold mb-2 text-red-600">Suspension Reason</h3>
              <p className="text-red-600">{user.suspendedReason}</p>
              {user.suspendedAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  Suspended on {new Date(user.suspendedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
          <div>
            <h3 className="font-semibold mb-2">Joined</h3>
            <p className="text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

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
            <div className="space-y-3">
              {memberships.map((membership: any) => (
                <div
                  key={membership.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {membership.organization?.logo && (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={membership.organization.logo} />
                        <AvatarFallback>
                          {membership.organization.name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="font-medium">{membership.organization?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {membership.organization?.level} • Joined{' '}
                        {new Date(membership.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {membership.isAdmin && <Badge variant="default">Admin</Badge>}
                    {membership.isActive ? (
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend this user? Please provide a reason for the suspension.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for suspension</Label>
              <Input
                id="reason"
                placeholder="e.g., Violation of community guidelines"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendDialog(false)
                setSuspendReason('')
              }}
              disabled={suspending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={suspending}
            >
              {suspending ? 'Suspending...' : 'Suspend User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

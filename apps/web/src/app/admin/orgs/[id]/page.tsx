'use client'

import { Suspense, use, useState } from 'react'
import { useQuery } from '@apollo/client'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Calendar,
  Shield,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Settings,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Input } from '@/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { GET_ORGANIZATION, GET_ORG_MEMBERS } from '@/lib/graphql/queries/admin'
import Link from 'next/link'

const MEMBERS_PER_PAGE = 10

// Format date helper
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format level for display
const formatLevel = (level: string) => {
  return level.replace('_', ' ').toUpperCase()
}

// Get initials from name
const getInitials = (firstName?: string, lastName?: string, displayName?: string) => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }
  if (displayName) {
    const names = displayName.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return displayName.substring(0, 2).toUpperCase()
  }
  return 'U'
}

function OrgDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') // 'view' or 'edit'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [membersPage, setMembersPage] = useState(1)
  const [memberSearch, setMemberSearch] = useState('')

  // Fetch organization data
  const { data, loading, error } = useQuery(GET_ORGANIZATION, {
    variables: { id },
  })

  // Fetch organization members
  const {
    data: membersData,
    loading: membersLoading,
    error: membersError,
  } = useQuery(GET_ORG_MEMBERS, {
    variables: {
      orgId: id,
      search: memberSearch || undefined,
      limit: MEMBERS_PER_PAGE,
      offset: (membersPage - 1) * MEMBERS_PER_PAGE,
    },
  })

  const organization = data?.organization
  const members = membersData?.getOrgMembers || []

  // Handle edit mode - navigate to edit page
  const handleEdit = () => {
    router.push(`/admin/orgs/${id}/edit`)
  }

  // Handle delete
  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    // TODO: Implement delete mutation when backend is ready
    console.log('Delete organization:', id)
    alert('Delete functionality will be implemented when backend mutation is ready')
    setShowDeleteConfirm(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-red-500">
              Error loading organization: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              Organization not found
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Build location string
  const locationParts = []
  if (organization.pollingUnit) locationParts.push(organization.pollingUnit.name)
  if (organization.ward) locationParts.push(organization.ward.name)
  if (organization.lga) locationParts.push(organization.lga.name)
  if (organization.state) locationParts.push(organization.state.name)
  if (organization.country) locationParts.push(organization.country.name)
  const locationString = locationParts.length > 0 ? locationParts.join(', ') : 'Not specified'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Organization Details</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/orgs/${id}/settings`}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Organization Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              {organization.logo ? (
                <img
                  src={organization.logo}
                  alt={organization.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Organization Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{organization.name}</h2>
                  <p className="text-sm text-muted-foreground mb-3">@{organization.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={organization.isActive ? 'success' : 'destructive'}>
                    {organization.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {organization.isVerified && (
                    <Badge variant="default">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              {organization.description && (
                <p className="text-muted-foreground mb-4">{organization.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{organization.memberCount || 0}</span>
                  <span className="text-muted-foreground">Members</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">{formatLevel(organization.level)}</Badge>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{locationString}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formatDate(organization.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banner */}
      {organization.banner && (
        <Card>
          <CardHeader>
            <CardTitle>Banner</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={organization.banner}
              alt={`${organization.name} banner`}
              className="w-full h-48 object-cover rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Location Details */}
      <Card>
        <CardHeader>
          <CardTitle>Location Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organization.country && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Country</p>
                <p className="font-medium">{organization.country.name}</p>
              </div>
            )}
            {organization.state && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">State</p>
                <p className="font-medium">{organization.state.name}</p>
              </div>
            )}
            {organization.lga && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">LGA</p>
                <p className="font-medium">{organization.lga.name}</p>
              </div>
            )}
            {organization.ward && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ward</p>
                <p className="font-medium">{organization.ward.name}</p>
              </div>
            )}
            {organization.pollingUnit && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Polling Unit</p>
                <p className="font-medium">{organization.pollingUnit.name}</p>
              </div>
            )}
            {!organization.country &&
              !organization.state &&
              !organization.lga &&
              !organization.ward &&
              !organization.pollingUnit && (
                <div className="text-muted-foreground">No location information available</div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Organization IDs (for debugging/reference) */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Organization ID</p>
              <p className="font-mono text-xs">{organization.id}</p>
            </div>
            {organization.movementId && (
              <div>
                <p className="text-muted-foreground mb-1">Movement ID</p>
                <p className="font-mono text-xs">{organization.movementId}</p>
              </div>
            )}
            {organization.parentId && (
              <div>
                <p className="text-muted-foreground mb-1">Parent Organization ID</p>
                <p className="font-mono text-xs">{organization.parentId}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground mb-1">Created</p>
              <p className="text-xs">{formatDate(organization.createdAt)}</p>
            </div>
            {organization.updatedAt && (
              <div>
                <p className="text-muted-foreground mb-1">Last Updated</p>
                <p className="text-xs">{formatDate(organization.updatedAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Members ({organization.memberCount || 0})</span>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value)
                    setMembersPage(1)
                  }}
                  className="pl-8"
                />
                <Users className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : membersError ? (
            <div className="text-center py-8 text-red-500">
              Error loading members: {membersError.message}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {memberSearch ? 'No members found matching your search' : 'No members yet'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((membership: any) => (
                    <TableRow key={membership.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={membership.user?.avatar} />
                            <AvatarFallback>
                              {getInitials(
                                membership.user?.firstName,
                                membership.user?.lastName,
                                membership.user?.displayName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {membership.user?.displayName ||
                                `${membership.user?.firstName || ''} ${
                                  membership.user?.lastName || ''
                                }`.trim() ||
                                'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {membership.user?.id || membership.userId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {membership.user?.email || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={membership.isAdmin ? 'default' : 'secondary'}>
                          {membership.isAdmin ? (
                            <>
                              <Shield className="mr-1 h-3 w-3" />
                              Admin
                            </>
                          ) : (
                            'Member'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={membership.isActive ? 'success' : 'destructive'}>
                          {membership.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(membership.joinedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Members Pagination */}
              {members.length === MEMBERS_PER_PAGE && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(membersPage - 1) * MEMBERS_PER_PAGE + 1} to{' '}
                    {(membersPage - 1) * MEMBERS_PER_PAGE + members.length} members
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMembersPage((p) => Math.max(1, p - 1))}
                      disabled={membersPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMembersPage((p) => p + 1)}
                      disabled={members.length < MEMBERS_PER_PAGE}
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirm Deletion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Are you sure you want to delete <strong>{organization.name}</strong>? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OrgDetailContent id={id} />
    </Suspense>
  )
}

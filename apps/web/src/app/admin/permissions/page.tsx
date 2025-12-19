'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Search, Shield, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { Badge } from '@/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { GET_ORG_MEMBERS, GET_MY_ORGANIZATIONS } from '@/lib/graphql/queries/admin'
import { UPDATE_MEMBER_ROLE } from '@/lib/graphql/mutations/organizations'
import { PERMISSIONS, ROLES, getPermissionsForRole, type RoleSlug } from '@/constants/permissions'

const ITEMS_PER_PAGE = 20

interface Member {
  id: string
  userId: string
  orgId: string
  isAdmin: boolean
  isActive: boolean
  joinedAt: string
  approvedAt?: string
  user: {
    id: string
    firstName?: string
    lastName?: string
    displayName?: string
    email: string
    avatar?: string
  }
  organization: {
    id: string
    name: string
    level: string
  }
}

export default function AdminPermissionsPage() {
  // Filter state
  const [movementId, setMovementId] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch user's organizations
  const { data: orgsData } = useQuery(GET_MY_ORGANIZATIONS)

  // Calculate pagination
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  // Build filter object
  const filter: any = {}
  if (searchTerm) filter.search = searchTerm
  if (roleFilter === 'admin') filter.isAdmin = true
  if (roleFilter === 'member') filter.isAdmin = false

  // Fetch members
  const { data, loading, error, refetch } = useQuery(GET_ORG_MEMBERS, {
    variables: {
      orgId: orgId || '',
      search: searchTerm || undefined,
      isAdmin: roleFilter === 'admin' ? true : roleFilter === 'member' ? false : undefined,
      limit: ITEMS_PER_PAGE,
      offset,
    },
    skip: !orgId,
  })

  // Update member role mutation
  const [updateMemberRole, { loading: updating }] = useMutation(UPDATE_MEMBER_ROLE, {
    onCompleted: () => {
      refetch()
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const organizations = orgsData?.myOrganizations || []
  const members: Member[] = data?.getOrgMembers || []

  // Handle role toggle
  const handleRoleToggle = async (membershipId: string, currentIsAdmin: boolean) => {
    const action = currentIsAdmin ? 'demote' : 'promote'
    const confirmMessage = currentIsAdmin
      ? 'Are you sure you want to demote this member from admin?'
      : 'Are you sure you want to promote this member to admin?'

    if (confirm(confirmMessage)) {
      try {
        await updateMemberRole({
          variables: {
            membershipId,
            isAdmin: !currentIsAdmin,
          },
        })
      } catch (err) {
        console.error(`Failed to ${action} member:`, err)
      }
    }
  }

  // Format user display name
  const getUserDisplayName = (user: Member['user']) => {
    if (user.displayName) return user.displayName
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
    if (user.firstName) return user.firstName
    return user.email
  }

  // Get user initials
  const getUserInitials = (user: Member['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user.displayName) {
      return user.displayName.slice(0, 2).toUpperCase()
    }
    return user.email.slice(0, 2).toUpperCase()
  }

  // Get role badge variant
  const getRoleBadgeVariant = (isAdmin: boolean) => {
    return isAdmin ? 'default' : 'outline'
  }

  // Get role display name
  const getRoleDisplayName = (isAdmin: boolean) => {
    return isAdmin ? 'Admin' : 'Member'
  }

  // Handle page change
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (members.length === ITEMS_PER_PAGE) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value === 'all' ? null : value)
    setCurrentPage(1)
  }

  const handleOrgChange = (value: string) => {
    setOrgId(value === 'none' ? null : value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Permissions Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage member roles and view permission matrix
          </p>
        </div>
        <Shield className="h-8 w-8 text-primary" />
      </div>

      {/* Permission Matrix Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Permission Matrix
          </CardTitle>
          <CardDescription>
            Overview of role capabilities in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Super Admin */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{ROLES.SUPER_ADMIN.name}</h3>
                <Badge>Level {ROLES.SUPER_ADMIN.level}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Full access to all admin features
              </p>
              <div className="space-y-1.5">
                {getPermissionsForRole(ROLES.SUPER_ADMIN.slug as RoleSlug).map((perm) => (
                  <div key={perm} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">
                      {perm.replace('admin:', '').replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Regular Admin */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{ROLES.ADMIN.name}</h3>
                <Badge variant="outline">Level {ROLES.ADMIN.level}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Basic admin features only
              </p>
              <div className="space-y-1.5">
                {getPermissionsForRole(ROLES.ADMIN.slug as RoleSlug).map((perm) => (
                  <div key={perm} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">
                      {perm.replace('admin:', '').replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Member */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{ROLES.MEMBER.name}</h3>
                <Badge variant="outline">Level {ROLES.MEMBER.level}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Mobile app access only
              </p>
              <div className="text-sm text-muted-foreground">
                No admin dashboard access
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Organization Selection */}
            <div className="space-y-2">
              <Label htmlFor="org">Organization</Label>
              <Select value={orgId || 'none'} onValueChange={handleOrgChange}>
                <SelectTrigger id="org">
                  <SelectValue placeholder="Select Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Select an organization
                  </SelectItem>
                  {organizations.map((org: any) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} ({org.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select an organization to view its members
              </p>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                  disabled={!orgId}
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <Label htmlFor="role">Filter by Role</Label>
              <Select
                value={roleFilter || 'all'}
                onValueChange={handleRoleFilterChange}
                disabled={!orgId}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins Only</SelectItem>
                  <SelectItem value="member">Members Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
          <CardDescription>
            View and manage member roles within the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!orgId ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Organization Selected</p>
              <p className="text-sm">
                Please select an organization from the filter above to view and manage members
              </p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading members: {error.message}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">No members found</p>
              <p className="text-sm">
                {searchTerm || roleFilter
                  ? 'Try adjusting your filters'
                  : 'This organization has no members yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user.avatar} />
                            <AvatarFallback>
                              {getUserInitials(member.user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {getUserDisplayName(member.user)}
                            </div>
                            {member.user.displayName && (
                              <div className="text-sm text-muted-foreground">
                                @{member.user.displayName}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.isAdmin)}>
                          {getRoleDisplayName(member.isAdmin)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.isActive ? 'default' : 'outline'}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={member.isAdmin ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleRoleToggle(member.id, member.isAdmin)}
                          disabled={updating}
                        >
                          {member.isAdmin ? 'Demote' : 'Promote'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {offset + 1} to {offset + members.length} members
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={members.length < ITEMS_PER_PAGE}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Search, Shield, ChevronLeft, ChevronRight, Info, UserCog, Crown, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Checkbox } from '@/ui/checkbox'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { Badge } from '@/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { GET_ORG_MEMBERS, GET_MY_ORGANIZATIONS } from '@/lib/graphql/queries/admin'
import { GET_STATES, GET_LGAS, GET_WARDS, GET_POLLING_UNITS } from '@/lib/graphql/queries/locations'
import { UPDATE_MEMBER_ROLE, MAKE_LEADER, REMOVE_LEADER } from '@/lib/graphql/mutations/organizations'
import { PERMISSIONS, ROLES, getPermissionsForRole, type RoleSlug } from '@/constants/permissions'
import { useToast } from '@/hooks/use-toast'

const ITEMS_PER_PAGE = 20

interface Member {
  id: string
  userId: string
  orgId: string
  isAdmin: boolean
  isActive: boolean
  isLeader: boolean
  isChairman: boolean
  leaderLevel: string | null
  leaderStateId: string | null
  leaderLgaId: string | null
  leaderWardId: string | null
  leaderPollingUnitId: string | null
  joinedAt: string
  approvedAt?: string
  user: {
    id: string
    firstName?: string
    lastName?: string
    displayName?: string
    email: string
    avatar?: string
    phoneNumber?: string
    profession?: string
    gender?: string
    state?: { name: string }
    lga?: { name: string }
    ward?: { name: string }
  }
  organization: {
    id: string
    name: string
    level: string
  }
}

export default function AdminPermissionsPage() {
  const { toast } = useToast()

  // Filter state
  const [orgId, setOrgId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Leader assignment dialog state
  const [leaderDialogOpen, setLeaderDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [leaderLevel, setLeaderLevel] = useState<string>('STATE')
  const [isChairman, setIsChairman] = useState<boolean>(false)
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null)
  const [selectedLgaId, setSelectedLgaId] = useState<string | null>(null)
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null)
  const [selectedPollingUnitId, setSelectedPollingUnitId] = useState<string | null>(null)

  // Fetch user's organizations
  const { data: orgsData } = useQuery(GET_MY_ORGANIZATIONS)

  // Fetch location data for leader assignment
  const { data: statesData } = useQuery(GET_STATES, {
    variables: { countryId: null },
    skip: !leaderDialogOpen,
  })
  const { data: lgasData } = useQuery(GET_LGAS, {
    variables: { stateId: selectedStateId },
    skip: !selectedStateId || leaderLevel === 'STATE',
  })
  const { data: wardsData } = useQuery(GET_WARDS, {
    variables: { lgaId: selectedLgaId },
    skip: !selectedLgaId || leaderLevel === 'STATE' || leaderLevel === 'LGA',
  })
  const { data: pollingUnitsData } = useQuery(GET_POLLING_UNITS, {
    variables: { wardId: selectedWardId },
    skip: !selectedWardId || leaderLevel !== 'POLLING_UNIT',
  })

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
      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Make leader mutation
  const [makeLeader, { loading: makingLeader }] = useMutation(MAKE_LEADER, {
    onCompleted: () => {
      refetch()
      setLeaderDialogOpen(false)
      resetLeaderForm()
      toast({
        title: 'Success',
        description: 'Leader assigned successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Remove leader mutation
  const [removeLeader, { loading: removingLeader }] = useMutation(REMOVE_LEADER, {
    onCompleted: () => {
      refetch()
      toast({
        title: 'Success',
        description: 'Leader role removed successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const organizations = orgsData?.myOrganizations || []
  const members: Member[] = data?.getOrgMembers || []
  const states = statesData?.states || []
  const lgas = lgasData?.lgas || []
  const wards = wardsData?.wards || []
  const pollingUnits = pollingUnitsData?.pollingUnits || []

  // Reset leader form
  const resetLeaderForm = () => {
    setSelectedMember(null)
    setLeaderLevel('STATE')
    setIsChairman(false)
    setSelectedStateId(null)
    setSelectedLgaId(null)
    setSelectedWardId(null)
    setSelectedPollingUnitId(null)
  }

  // Handle role toggle (Admin/Member)
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

  // Handle open leader dialog
  const handleOpenLeaderDialog = (member: Member) => {
    setSelectedMember(member)

    // Pre-populate if already a leader
    if (member.isLeader && member.leaderLevel) {
      setLeaderLevel(member.leaderLevel)
      setIsChairman(member.isChairman || false)
      if (member.leaderStateId) setSelectedStateId(member.leaderStateId)
      if (member.leaderLgaId) setSelectedLgaId(member.leaderLgaId)
      if (member.leaderWardId) setSelectedWardId(member.leaderWardId)
      if (member.leaderPollingUnitId) setSelectedPollingUnitId(member.leaderPollingUnitId)
    }

    setLeaderDialogOpen(true)
  }

  // Handle assign leader
  const handleAssignLeader = async () => {
    if (!selectedMember) return

    // Validate location selection based on level
    if (leaderLevel === 'STATE' && !selectedStateId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a state',
        variant: 'destructive',
      })
      return
    }
    if (leaderLevel === 'LGA' && (!selectedStateId || !selectedLgaId)) {
      toast({
        title: 'Validation Error',
        description: 'Please select state and LGA',
        variant: 'destructive',
      })
      return
    }
    if (leaderLevel === 'WARD' && (!selectedStateId || !selectedLgaId || !selectedWardId)) {
      toast({
        title: 'Validation Error',
        description: 'Please select state, LGA, and ward',
        variant: 'destructive',
      })
      return
    }
    if (leaderLevel === 'POLLING_UNIT' && (!selectedStateId || !selectedLgaId || !selectedWardId || !selectedPollingUnitId)) {
      toast({
        title: 'Validation Error',
        description: 'Please select state, LGA, ward, and polling unit',
        variant: 'destructive',
      })
      return
    }

    await makeLeader({
      variables: {
        input: {
          membershipId: selectedMember.id,
          level: leaderLevel,
          isChairman: isChairman,
          stateId: selectedStateId,
          lgaId: selectedLgaId,
          wardId: selectedWardId,
          pollingUnitId: selectedPollingUnitId,
        },
      },
    })
  }

  // Handle remove leader
  const handleRemoveLeader = async (membershipId: string) => {
    if (confirm('Are you sure you want to remove this leader role?')) {
      await removeLeader({
        variables: { membershipId },
      })
    }
  }

  // Handle level change - reset dependent fields
  const handleLeaderLevelChange = (value: string) => {
    setLeaderLevel(value)
    if (value === 'STATE') {
      setSelectedLgaId(null)
      setSelectedWardId(null)
      setSelectedPollingUnitId(null)
    } else if (value === 'LGA') {
      setSelectedWardId(null)
      setSelectedPollingUnitId(null)
    } else if (value === 'WARD') {
      setSelectedPollingUnitId(null)
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
  const getRoleBadgeVariant = (member: Member) => {
    if (member.isAdmin) return 'default'
    if (member.isLeader) return 'secondary'
    return 'outline'
  }

  // Get role display name
  const getRoleDisplayName = (member: Member) => {
    if (member.isAdmin) return 'Admin'
    if (member.isLeader) {
      const level = member.leaderLevel || ''
      if (member.isChairman) {
        return `Chairman (${level.replace('_', ' ')})`
      }
      return `Leader (${level.replace('_', ' ')})`
    }
    return 'Member'
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
            Manage member roles, admin status, and assign leaders with location scope
          </p>
        </div>
        <Shield className="h-8 w-8 text-primary" />
      </div>

      {/* Permission Matrix Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Role Hierarchy Overview
          </CardTitle>
          <CardDescription>
            Understanding role capabilities and hierarchy in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

            {/* Leader */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{ROLES.LEADER.name}</h3>
                <Badge variant="outline">Level {ROLES.LEADER.level}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Geographic scope leadership
              </p>
              <div className="space-y-1.5">
                {getPermissionsForRole(ROLES.LEADER.slug as RoleSlug).map((perm) => (
                  <div key={perm} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    <span className="text-muted-foreground">
                      {perm.replace('admin:', '').replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                Scoped to assigned geographic area
              </p>
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-xs">
                    Chairman
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Chairmen have all leader permissions plus wallet access to manage organization finances
                </p>
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
            View and manage member roles, admin status, and leader assignments
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
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getRoleBadgeVariant(member)}>
                              {getRoleDisplayName(member)}
                            </Badge>
                            {member.isChairman && (
                              <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                                Wallet Access
                              </Badge>
                            )}
                          </div>
                          {member.isLeader && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {member.leaderLevel?.replace('_', ' ')}
                            </div>
                          )}
                        </div>
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
                        <div className="flex gap-2 justify-end">
                          {!member.isLeader && (
                            <Button
                              variant={member.isAdmin ? 'outline' : 'default'}
                              size="sm"
                              onClick={() => handleRoleToggle(member.id, member.isAdmin)}
                              disabled={updating}
                            >
                              <UserCog className="h-4 w-4 mr-1" />
                              {member.isAdmin ? 'Demote' : 'Promote'}
                            </Button>
                          )}
                          {member.isLeader ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveLeader(member.id)}
                              disabled={removingLeader}
                            >
                              Remove Leader
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenLeaderDialog(member)}
                            >
                              <Crown className="h-4 w-4 mr-1" />
                              Make Leader
                            </Button>
                          )}
                        </div>
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

      {/* Leader Assignment Dialog */}
      <Dialog open={leaderDialogOpen} onOpenChange={(open) => {
        setLeaderDialogOpen(open)
        if (!open) resetLeaderForm()
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Leader Role</DialogTitle>
            <DialogDescription>
              Assign {selectedMember ? getUserDisplayName(selectedMember.user) : 'member'} as a leader with geographic scope
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Leader Level */}
            <div className="space-y-2">
              <Label htmlFor="leader-level">Leadership Level</Label>
              <Select value={leaderLevel} onValueChange={handleLeaderLevelChange}>
                <SelectTrigger id="leader-level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STATE">State Level</SelectItem>
                  <SelectItem value="LGA">LGA Level</SelectItem>
                  <SelectItem value="WARD">Ward Level</SelectItem>
                  <SelectItem value="POLLING_UNIT">Polling Unit Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* State Selection */}
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select value={selectedStateId || ''} onValueChange={setSelectedStateId}>
                <SelectTrigger id="state">
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

            {/* LGA Selection */}
            {(leaderLevel === 'LGA' || leaderLevel === 'WARD' || leaderLevel === 'POLLING_UNIT') && (
              <div className="space-y-2">
                <Label htmlFor="lga">LGA *</Label>
                <Select
                  value={selectedLgaId || ''}
                  onValueChange={setSelectedLgaId}
                  disabled={!selectedStateId}
                >
                  <SelectTrigger id="lga">
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
            )}

            {/* Ward Selection */}
            {(leaderLevel === 'WARD' || leaderLevel === 'POLLING_UNIT') && (
              <div className="space-y-2">
                <Label htmlFor="ward">Ward *</Label>
                <Select
                  value={selectedWardId || ''}
                  onValueChange={setSelectedWardId}
                  disabled={!selectedLgaId}
                >
                  <SelectTrigger id="ward">
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
            )}

            {/* Polling Unit Selection */}
            {leaderLevel === 'POLLING_UNIT' && (
              <div className="space-y-2">
                <Label htmlFor="polling-unit">Polling Unit *</Label>
                <Select
                  value={selectedPollingUnitId || ''}
                  onValueChange={setSelectedPollingUnitId}
                  disabled={!selectedWardId}
                >
                  <SelectTrigger id="polling-unit">
                    <SelectValue placeholder="Select polling unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {pollingUnits.map((unit: any) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Chairman Checkbox */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="chairman"
                  checked={isChairman}
                  onCheckedChange={(checked) => setIsChairman(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="chairman"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Make Chairman
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Chairmen have wallet access and can manage organization finances. Regular leaders don't have wallet access.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLeaderDialogOpen(false)
                resetLeaderForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignLeader}
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

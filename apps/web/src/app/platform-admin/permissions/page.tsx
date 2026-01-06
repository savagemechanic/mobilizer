'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import {
  Search,
  Shield,
  ChevronLeft,
  ChevronRight,
  Info,
  UserCog,
  Crown,
  MapPin,
  Users,
  Layers,
  Filter,
  UserPlus,
} from 'lucide-react'
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
import {
  GET_ALL_USERS,
  GET_MOVEMENTS,
  SEARCH_USERS,
} from '@/lib/graphql/queries/platform-admin'
import { GET_STATES, GET_LGAS, GET_WARDS, GET_POLLING_UNITS } from '@/lib/graphql/queries/locations'
import {
  GRANT_PLATFORM_ADMIN,
  REVOKE_PLATFORM_ADMIN,
  ASSIGN_SUPER_ADMIN,
  REVOKE_SUPER_ADMIN,
} from '@/lib/graphql/mutations/platform-admin'
import { UPDATE_MEMBER_ROLE, MAKE_LEADER, REMOVE_LEADER } from '@/lib/graphql/mutations/organizations'
import { PERMISSIONS, ROLES, getPermissionsForRole, type RoleSlug } from '@/constants/permissions'
import { useToast } from '@/hooks/use-toast'

const ITEMS_PER_PAGE = 20

interface UserWithRoles {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  displayName?: string
  email: string
  avatar?: string
  isPlatformAdmin: boolean
  isActive: boolean
  isSuspended: boolean
  createdAt: string
  // These will be populated from movement/org data
  movements?: Array<{
    id: string
    name: string
    role: 'SUPER_ADMIN'
  }>
  organizations?: Array<{
    id: string
    name: string
    movementId?: string
    movementName?: string
    isAdmin: boolean
    isLeader: boolean
    leaderLevel?: string
  }>
}

interface LeaderDialogState {
  open: boolean
  userId: string | null
  orgId: string | null
  existingLevel?: string
  existingStateId?: string
  existingLgaId?: string
  existingWardId?: string
  existingPollingUnitId?: string
}

export default function PlatformAdminPermissionsPage() {
  const { toast } = useToast()

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [movementFilter, setMovementFilter] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)

  // Leader assignment dialog state
  const [leaderDialogOpen, setLeaderDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [leaderLevel, setLeaderLevel] = useState<string>('STATE')
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null)
  const [selectedLgaId, setSelectedLgaId] = useState<string | null>(null)
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null)
  const [selectedPollingUnitId, setSelectedPollingUnitId] = useState<string | null>(null)

  // Super Admin assignment state
  const [superAdminDialogOpen, setSuperAdminDialogOpen] = useState(false)
  const [selectedUserForSuperAdmin, setSelectedUserForSuperAdmin] = useState<string | null>(null)
  const [selectedMovementForSuperAdmin, setSelectedMovementForSuperAdmin] = useState<string | null>(null)

  // Fetch movements
  const { data: movementsData } = useQuery(GET_MOVEMENTS, {
    variables: {
      filter: {},
      limit: 100,
      offset: 0,
    },
  })

  // Build filter for users query
  const buildUserFilter = () => {
    const filter: any = {}
    if (searchTerm) filter.search = searchTerm
    if (roleFilter === 'platformAdmin') filter.isPlatformAdmin = true
    return Object.keys(filter).length > 0 ? filter : undefined
  }

  // Fetch users with pagination
  const { data: usersData, loading, error, refetch } = useQuery(GET_ALL_USERS, {
    variables: {
      filter: buildUserFilter(),
      pagination: {
        limit: ITEMS_PER_PAGE,
        offset: currentPage * ITEMS_PER_PAGE,
      },
    },
    fetchPolicy: 'network-only',
  })

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

  // Mutations
  const [grantPlatformAdmin, { loading: grantingAdmin }] = useMutation(GRANT_PLATFORM_ADMIN, {
    onCompleted: () => {
      refetch()
      toast({
        title: 'Success',
        description: 'Platform admin privileges granted successfully',
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

  const [revokePlatformAdmin, { loading: revokingAdmin }] = useMutation(REVOKE_PLATFORM_ADMIN, {
    onCompleted: () => {
      refetch()
      toast({
        title: 'Success',
        description: 'Platform admin privileges revoked successfully',
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

  const [assignSuperAdmin, { loading: assigningSuperAdmin }] = useMutation(ASSIGN_SUPER_ADMIN, {
    onCompleted: () => {
      setSuperAdminDialogOpen(false)
      setSelectedUserForSuperAdmin(null)
      setSelectedMovementForSuperAdmin(null)
      refetch()
      toast({
        title: 'Success',
        description: 'Super admin assigned successfully',
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

  const [revokeSuperAdmin, { loading: revokingSuperAdmin }] = useMutation(REVOKE_SUPER_ADMIN, {
    onCompleted: () => {
      refetch()
      toast({
        title: 'Success',
        description: 'Super admin role revoked successfully',
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

  const movements = movementsData?.movements || []
  const users: UserWithRoles[] = usersData?.allUsers?.items || []
  const totalCount = usersData?.allUsers?.totalCount || 0
  const hasMore = usersData?.allUsers?.hasMore || false
  const states = statesData?.states || []
  const lgas = lgasData?.lgas || []
  const wards = wardsData?.wards || []
  const pollingUnits = pollingUnitsData?.pollingUnits || []

  // Build users with roles by cross-referencing movements
  const usersWithRoles: UserWithRoles[] = users.map((user) => {
    // Find movements where this user is a super admin
    const userMovements = movements
      .filter((movement: any) =>
        movement.superAdmins?.some((admin: any) => admin.id === user.id)
      )
      .map((movement: any) => ({
        id: movement.id,
        name: movement.name,
        role: 'SUPER_ADMIN' as const,
      }))

    return {
      ...user,
      movements: userMovements,
      organizations: [], // This would need to be fetched from user memberships if needed
    }
  })

  // Apply movement filter
  const filteredUsers = usersWithRoles.filter((user) => {
    if (!movementFilter) return true
    return user.movements?.some((m) => m.id === movementFilter)
  })

  // Apply role filter
  const finalFilteredUsers = filteredUsers.filter((user) => {
    if (!roleFilter) return true
    if (roleFilter === 'platformAdmin') return user.isPlatformAdmin
    if (roleFilter === 'superAdmin') return (user.movements?.length || 0) > 0
    if (roleFilter === 'admin') return false // Would need org membership data
    if (roleFilter === 'leader') return false // Would need org membership data
    if (roleFilter === 'member') return !user.isPlatformAdmin && (user.movements?.length || 0) === 0
    return true
  })

  // Format user display name
  const getUserDisplayName = (user: UserWithRoles) => {
    if (user.displayName) return user.displayName
    if (user.firstName && user.lastName) {
      return user.middleName
        ? `${user.firstName} ${user.middleName} ${user.lastName}`
        : `${user.firstName} ${user.lastName}`
    }
    return user.email
  }

  // Get user initials
  const getUserInitials = (user: UserWithRoles) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user.displayName) {
      return user.displayName.slice(0, 2).toUpperCase()
    }
    return user.email.slice(0, 2).toUpperCase()
  }

  // Get user roles display
  const getUserRoles = (user: UserWithRoles) => {
    const roles: string[] = []
    if (user.isPlatformAdmin) roles.push('Platform Admin')
    if (user.movements && user.movements.length > 0) {
      roles.push(`Super Admin (${user.movements.length})`)
    }
    if (roles.length === 0) roles.push('Member')
    return roles
  }

  // Handle grant platform admin
  const handleGrantPlatformAdmin = async (userId: string, userName: string) => {
    if (
      confirm(
        `Are you sure you want to grant Platform Admin privileges to ${userName}? This gives them full system access.`
      )
    ) {
      await grantPlatformAdmin({ variables: { userId } })
    }
  }

  // Handle revoke platform admin
  const handleRevokePlatformAdmin = async (userId: string, userName: string) => {
    if (
      confirm(`Are you sure you want to revoke Platform Admin privileges from ${userName}?`)
    ) {
      await revokePlatformAdmin({ variables: { userId } })
    }
  }

  // Handle open super admin assignment
  const handleOpenSuperAdminDialog = (userId: string) => {
    setSelectedUserForSuperAdmin(userId)
    setSuperAdminDialogOpen(true)
  }

  // Handle assign super admin
  const handleAssignSuperAdmin = async () => {
    if (!selectedUserForSuperAdmin || !selectedMovementForSuperAdmin) {
      toast({
        title: 'Validation Error',
        description: 'Please select a movement',
        variant: 'destructive',
      })
      return
    }

    await assignSuperAdmin({
      variables: {
        movementId: selectedMovementForSuperAdmin,
        userId: selectedUserForSuperAdmin,
      },
    })
  }

  // Handle revoke super admin
  const handleRevokeSuperAdmin = async (
    userId: string,
    movementId: string,
    userName: string,
    movementName: string
  ) => {
    if (
      confirm(
        `Are you sure you want to revoke Super Admin access for ${userName} from ${movementName}?`
      )
    ) {
      await revokeSuperAdmin({
        variables: {
          movementId,
          userId,
        },
      })
    }
  }

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Reset to page 0 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0)
  }

  const handleMovementFilterChange = (value: string) => {
    setMovementFilter(value === 'all' ? null : value)
    setCurrentPage(0)
  }

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value === 'all' ? null : value)
    setCurrentPage(0)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Platform Permissions Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage platform admins, super admins, and role assignments across all movements
          </p>
        </div>
        <Shield className="h-8 w-8 text-primary" />
      </div>

      {/* Role Hierarchy Overview */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Platform Role Hierarchy
          </CardTitle>
          <CardDescription>
            Understanding role capabilities and hierarchy across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Platform Admin */}
            <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{ROLES.PLATFORM_ADMIN.name}</h3>
                <Badge className="bg-purple-600">Level {ROLES.PLATFORM_ADMIN.level}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                God mode - Full platform control
              </p>
              <div className="space-y-1.5">
                {getPermissionsForRole(ROLES.PLATFORM_ADMIN.slug as RoleSlug).map((perm) => (
                  <div key={perm} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    <span className="text-muted-foreground">
                      {perm.replace('platform:', '').replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Super Admin */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{ROLES.SUPER_ADMIN.name}</h3>
                <Badge>Level {ROLES.SUPER_ADMIN.level}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Full movement management
              </p>
              <div className="space-y-1.5">
                {getPermissionsForRole(ROLES.SUPER_ADMIN.slug as RoleSlug).slice(0, 4).map((perm) => (
                  <div key={perm} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">
                      {perm.replace('admin:', '').replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic">+ 4 more</p>
              </div>
            </div>

            {/* Regular Admin */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{ROLES.ADMIN.name}</h3>
                <Badge variant="outline">Level {ROLES.ADMIN.level}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Basic org admin features
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
                Scoped to assigned location
              </p>
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
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="text-lg">Filter Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
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
                />
              </div>
            </div>

            {/* Movement Filter */}
            <div className="space-y-2">
              <Label htmlFor="movement">Filter by Movement</Label>
              <Select
                value={movementFilter || 'all'}
                onValueChange={handleMovementFilterChange}
              >
                <SelectTrigger id="movement">
                  <SelectValue placeholder="All Movements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Movements</SelectItem>
                  {movements.map((movement: any) => (
                    <SelectItem key={movement.id} value={movement.id}>
                      {movement.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <Label htmlFor="role">Filter by Role</Label>
              <Select value={roleFilter || 'all'} onValueChange={handleRoleFilterChange}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="platformAdmin">Platform Admins</SelectItem>
                  <SelectItem value="superAdmin">Super Admins</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="leader">Leaders</SelectItem>
                  <SelectItem value="member">Members</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle>Platform Users & Permissions</CardTitle>
          <CardDescription>
            Manage user roles, platform admin status, and movement assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading users: {error.message}
            </div>
          ) : finalFilteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No users found</p>
              <p className="text-sm">
                {searchTerm || movementFilter || roleFilter
                  ? 'Try adjusting your filters'
                  : 'No users available'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role(s)</TableHead>
                    <TableHead>Movements</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finalFilteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{getUserDisplayName(user)}</div>
                            {user.displayName && (
                              <div className="text-sm text-muted-foreground">
                                @{user.displayName}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getUserRoles(user).map((role, idx) => (
                            <Badge
                              key={idx}
                              variant={
                                role.includes('Platform Admin')
                                  ? 'default'
                                  : role.includes('Super Admin')
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className={
                                role.includes('Platform Admin')
                                  ? 'bg-purple-600'
                                  : ''
                              }
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.movements && user.movements.length > 0 ? (
                          <div className="space-y-1">
                            {user.movements.slice(0, 2).map((movement) => (
                              <div
                                key={movement.id}
                                className="flex items-center gap-1 text-sm"
                              >
                                <Layers className="h-3 w-3" />
                                <span>{movement.name}</span>
                              </div>
                            ))}
                            {user.movements.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{user.movements.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.isSuspended
                              ? 'destructive'
                              : user.isActive
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {user.isSuspended
                            ? 'Suspended'
                            : user.isActive
                            ? 'Active'
                            : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {user.isPlatformAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleRevokePlatformAdmin(
                                  user.id,
                                  getUserDisplayName(user)
                                )
                              }
                              disabled={revokingAdmin}
                              className="border-orange-600 text-orange-600 hover:bg-orange-50"
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Revoke PA
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleGrantPlatformAdmin(
                                  user.id,
                                  getUserDisplayName(user)
                                )
                              }
                              disabled={grantingAdmin}
                              className="border-purple-600 text-purple-600 hover:bg-purple-50"
                            >
                              <Crown className="h-4 w-4 mr-1" />
                              Make PA
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenSuperAdminDialog(user.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign SA
                          </Button>
                        </div>
                        {user.movements && user.movements.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 justify-end">
                            {user.movements.map((movement) => (
                              <Button
                                key={movement.id}
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRevokeSuperAdmin(
                                    user.id,
                                    movement.id,
                                    getUserDisplayName(user),
                                    movement.name
                                  )
                                }
                                disabled={revokingSuperAdmin}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Revoke from {movement.name}
                              </Button>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {currentPage * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCount)} of{' '}
                  {totalCount} users
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!hasMore}
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

      {/* Super Admin Assignment Dialog */}
      <Dialog
        open={superAdminDialogOpen}
        onOpenChange={(open) => {
          setSuperAdminDialogOpen(open)
          if (!open) {
            setSelectedUserForSuperAdmin(null)
            setSelectedMovementForSuperAdmin(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Super Admin Role</DialogTitle>
            <DialogDescription>
              Assign this user as a Super Admin for a movement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="movement-select">Select Movement *</Label>
              <Select
                value={selectedMovementForSuperAdmin || ''}
                onValueChange={setSelectedMovementForSuperAdmin}
              >
                <SelectTrigger id="movement-select">
                  <SelectValue placeholder="Select movement" />
                </SelectTrigger>
                <SelectContent>
                  {movements.map((movement: any) => (
                    <SelectItem key={movement.id} value={movement.id}>
                      {movement.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuperAdminDialogOpen(false)
                setSelectedUserForSuperAdmin(null)
                setSelectedMovementForSuperAdmin(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignSuperAdmin} disabled={assigningSuperAdmin}>
              {assigningSuperAdmin ? 'Assigning...' : 'Assign Super Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

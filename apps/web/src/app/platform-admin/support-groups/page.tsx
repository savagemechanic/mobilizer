'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
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
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { ConfirmDialog } from '@/modals'
import { GET_PLATFORM_ORGANIZATIONS, GET_MOVEMENTS } from '@/lib/graphql/queries/platform-admin'
import {
  GET_COUNTRIES,
  GET_STATES,
  GET_LGAS,
  GET_WARDS,
  GET_POLLING_UNITS,
} from '@/lib/graphql/queries/locations'
import { OrgLevel } from '@mobilizer/shared'

const ITEMS_PER_PAGE = 20

export default function PlatformAdminSupportGroupsPage() {
  const router = useRouter()

  // Filter state
  const [movementFilter, setMovementFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [privacyFilter, setPrivacyFilter] = useState<string>('all')

  // Location filters
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [lgaFilter, setLgaFilter] = useState<string>('all')
  const [wardFilter, setWardFilter] = useState<string>('all')
  const [pollingUnitFilter, setPollingUnitFilter] = useState<string>('all')

  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    orgId: string | null
    orgName: string | null
  }>({
    open: false,
    orgId: null,
    orgName: null,
  })

  // Fetch movements
  const { data: movementsData } = useQuery(GET_MOVEMENTS, {
    variables: { filter: { isActive: true } },
  })

  // Fetch location data
  const { data: countriesData } = useQuery(GET_COUNTRIES)
  const { data: statesData } = useQuery(GET_STATES, {
    variables: { countryId: countryFilter !== 'all' ? countryFilter : undefined },
    skip: countryFilter === 'all',
  })
  const { data: lgasData } = useQuery(GET_LGAS, {
    variables: { stateId: stateFilter !== 'all' ? stateFilter : undefined },
    skip: stateFilter === 'all',
  })
  const { data: wardsData } = useQuery(GET_WARDS, {
    variables: { lgaId: lgaFilter !== 'all' ? lgaFilter : undefined },
    skip: lgaFilter === 'all',
  })
  const { data: pollingUnitsData } = useQuery(GET_POLLING_UNITS, {
    variables: { wardId: wardFilter !== 'all' ? wardFilter : undefined },
    skip: wardFilter === 'all',
  })

  // Build filter object
  const buildFilter = () => {
    const filter: any = {}
    if (searchTerm) filter.search = searchTerm
    if (levelFilter !== 'all') filter.level = levelFilter
    if (stateFilter !== 'all') filter.stateId = stateFilter
    if (lgaFilter !== 'all') filter.lgaId = lgaFilter
    if (wardFilter !== 'all') filter.wardId = wardFilter
    return filter
  }

  // Calculate pagination
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  // Fetch organizations
  const { data, loading, error, refetch } = useQuery(GET_PLATFORM_ORGANIZATIONS, {
    variables: {
      filter: buildFilter(),
      limit: ITEMS_PER_PAGE,
      offset,
    },
    fetchPolicy: 'network-only',
  })

  const movements = movementsData?.movements || []
  const countries = countriesData?.countries || []
  const states = statesData?.states || []
  const lgas = lgasData?.lgas || []
  const wards = wardsData?.wards || []
  const pollingUnits = pollingUnitsData?.pollingUnits || []

  let organizations = data?.organizations || []

  // Apply client-side filters for movement, status, privacy, country, and polling unit
  // (since these are not supported by the GraphQL filter)
  if (movementFilter !== 'all') {
    organizations = organizations.filter((org: any) => org.movementId === movementFilter)
  }
  if (statusFilter === 'active') {
    organizations = organizations.filter((org: any) => org.isActive)
  } else if (statusFilter === 'inactive') {
    organizations = organizations.filter((org: any) => !org.isActive)
  }
  if (privacyFilter === 'public') {
    organizations = organizations.filter((org: any) => !org.isPrivate)
  } else if (privacyFilter === 'private') {
    organizations = organizations.filter((org: any) => org.isPrivate)
  }
  if (countryFilter !== 'all') {
    organizations = organizations.filter((org: any) => org.countryId === countryFilter)
  }
  if (pollingUnitFilter !== 'all') {
    organizations = organizations.filter((org: any) => org.pollingUnitId === pollingUnitFilter)
  }

  // Format level for display
  const formatLevel = (level: string) => {
    return level.replace('_', ' ').toUpperCase()
  }

  // Format location display
  const formatLocation = (org: any) => {
    const parts = []
    if (org.pollingUnit) parts.push(org.pollingUnit.name)
    if (org.ward) parts.push(org.ward.name)
    if (org.lga) parts.push(org.lga.name)
    if (org.state) parts.push(org.state.name)
    if (org.country) parts.push(org.country.name)
    return parts.length > 0 ? parts.join(', ') : 'N/A'
  }

  // Handle page change
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (organizations.length === ITEMS_PER_PAGE) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleLevelChange = (value: string) => {
    setLevelFilter(value)
    setCurrentPage(1)
  }

  const handleMovementChange = (value: string) => {
    setMovementFilter(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handlePrivacyChange = (value: string) => {
    setPrivacyFilter(value)
    setCurrentPage(1)
  }

  const handleCountryChange = (value: string) => {
    setCountryFilter(value)
    setStateFilter('all')
    setLgaFilter('all')
    setWardFilter('all')
    setPollingUnitFilter('all')
    setCurrentPage(1)
  }

  const handleStateChange = (value: string) => {
    setStateFilter(value)
    setLgaFilter('all')
    setWardFilter('all')
    setPollingUnitFilter('all')
    setCurrentPage(1)
  }

  const handleLgaChange = (value: string) => {
    setLgaFilter(value)
    setWardFilter('all')
    setPollingUnitFilter('all')
    setCurrentPage(1)
  }

  const handleWardChange = (value: string) => {
    setWardFilter(value)
    setPollingUnitFilter('all')
    setCurrentPage(1)
  }

  const handlePollingUnitChange = (value: string) => {
    setPollingUnitFilter(value)
    setCurrentPage(1)
  }

  const handleDeleteClick = (orgId: string, orgName: string) => {
    setConfirmDialog({
      open: true,
      orgId,
      orgName,
    })
  }

  const handleConfirmDelete = () => {
    if (confirmDialog.orgId) {
      // TODO: Implement delete mutation
      console.log('Delete org:', confirmDialog.orgId)
      setConfirmDialog({ open: false, orgId: null, orgName: null })
    }
  }

  const handleClearFilters = () => {
    setMovementFilter('all')
    setSearchTerm('')
    setLevelFilter('all')
    setStatusFilter('all')
    setPrivacyFilter('all')
    setCountryFilter('all')
    setStateFilter('all')
    setLgaFilter('all')
    setWardFilter('all')
    setPollingUnitFilter('all')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            All Support Groups
          </h1>
          <p className="text-gray-600 mt-1">
            Manage support groups across all movements
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          {showFilters ? 'Hide' : 'Show'} Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="border-indigo-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Clear All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* First Row: Movement, Search, Level */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="movement">Movement</Label>
                  <Select value={movementFilter} onValueChange={handleMovementChange}>
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

                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Organization Level</Label>
                  <Select value={levelFilter} onValueChange={handleLevelChange}>
                    <SelectTrigger id="level">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value={OrgLevel.NATIONAL}>National</SelectItem>
                      <SelectItem value={OrgLevel.STATE}>State</SelectItem>
                      <SelectItem value={OrgLevel.LGA}>LGA</SelectItem>
                      <SelectItem value={OrgLevel.WARD}>Ward</SelectItem>
                      <SelectItem value={OrgLevel.UNIT}>Unit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Second Row: Status, Privacy, Country */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={handleStatusChange}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privacy">Privacy</Label>
                  <Select value={privacyFilter} onValueChange={handlePrivacyChange}>
                    <SelectTrigger id="privacy">
                      <SelectValue placeholder="All Privacy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Privacy</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={countryFilter} onValueChange={handleCountryChange}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {countries.map((country: any) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Third Row: Location Hierarchy - State, LGA, Ward */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={stateFilter}
                    onValueChange={handleStateChange}
                    disabled={countryFilter === 'all'}
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {states.map((state: any) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lga">LGA</Label>
                  <Select
                    value={lgaFilter}
                    onValueChange={handleLgaChange}
                    disabled={stateFilter === 'all'}
                  >
                    <SelectTrigger id="lga">
                      <SelectValue placeholder="All LGAs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All LGAs</SelectItem>
                      {lgas.map((lga: any) => (
                        <SelectItem key={lga.id} value={lga.id}>
                          {lga.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ward">Ward</Label>
                  <Select
                    value={wardFilter}
                    onValueChange={handleWardChange}
                    disabled={lgaFilter === 'all'}
                  >
                    <SelectTrigger id="ward">
                      <SelectValue placeholder="All Wards" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Wards</SelectItem>
                      {wards.map((ward: any) => (
                        <SelectItem key={ward.id} value={ward.id}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fourth Row: Polling Unit */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pollingUnit">Polling Unit</Label>
                  <Select
                    value={pollingUnitFilter}
                    onValueChange={handlePollingUnitChange}
                    disabled={wardFilter === 'all'}
                  >
                    <SelectTrigger id="pollingUnit">
                      <SelectValue placeholder="All Polling Units" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Polling Units</SelectItem>
                      {pollingUnits.map((unit: any) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations Table */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Support Groups ({organizations.length})</span>
            {loading && <LoadingSpinner />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-red-500">
              Error loading organizations: {error.message}
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No support groups found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Movement</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Privacy</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org: any) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {org.logo && (
                              <img
                                src={org.logo}
                                alt={org.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <div>{org.name}</div>
                              <div className="text-xs text-gray-500">{org.slug}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatLevel(org.level)}</Badge>
                        </TableCell>
                        <TableCell>
                          {org.movement ? (
                            <Link
                              href={`/platform-admin/movements/${org.movement.id}`}
                              className="text-indigo-600 hover:underline"
                            >
                              {org.movement.name}
                            </Link>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>{org.memberCount || 0}</TableCell>
                        <TableCell>
                          <Badge variant={org.isPrivate ? 'secondary' : 'outline'}>
                            {org.isPrivate ? 'Private' : 'Public'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={org.isActive ? 'default' : 'destructive'}
                            className={
                              org.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : ''
                            }
                          >
                            {org.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {formatLocation(org)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/platform-admin/support-groups/${org.id}`)
                              }
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/platform-admin/support-groups/${org.id}/edit`)
                              }
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/platform-admin/support-groups/${org.id}/settings`)
                              }
                              title="Settings"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(org.id, org.name)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {offset + 1} to {offset + organizations.length} support groups
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={organizations.length < ITEMS_PER_PAGE || loading}
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

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ open, orgId: null, orgName: null })
        }
        title="Delete Support Group"
        description={`Are you sure you want to delete ${confirmDialog.orgName}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

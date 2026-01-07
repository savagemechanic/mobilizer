'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@apollo/client'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, Eye, UserCheck, UserX, Crown } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { usePermissions } from '@/hooks/usePermissions'
import { GET_ORG_MEMBERS } from '@/lib/graphql/queries/admin'
import { GET_MOVEMENTS } from '@/lib/graphql/queries/platform-admin'
import {
  GET_COUNTRIES,
  GET_GEOPOLITICAL_ZONES,
  GET_STATES,
  GET_SENATORIAL_ZONES,
  GET_FEDERAL_CONSTITUENCIES,
  GET_LGAS,
  GET_WARDS,
  GET_POLLING_UNITS,
} from '@/lib/graphql/queries/locations'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Badge } from '@/ui/badge'
import { Label } from '@/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { ListPageTemplate } from '@/templates'

interface OrgMember {
  id: string
  userId: string
  orgId: string
  isAdmin: boolean
  isActive: boolean
  isVerified: boolean
  isBlocked: boolean
  isLeader: boolean
  isChairman: boolean
  leaderLevel?: string
  joinedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
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
    slug: string
    logo?: string
  }
}

const ITEMS_PER_PAGE = 20

export default function AdminMembersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Get current user and role information
  const user = useAuthStore((state) => state.user)
  const { isPlatformAdmin, isSuperAdmin } = usePermissions()

  // Movement filter
  const [movementId, setMovementId] = useState<string | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

  // Location filters
  const [countryId, setCountryId] = useState<string | null>(null)
  const [geopoliticalZoneId, setGeopoliticalZoneId] = useState<string | null>(null)
  const [stateId, setStateId] = useState<string | null>(null)
  const [senatorialZoneId, setSenatorialZoneId] = useState<string | null>(null)
  const [federalConstituencyId, setFederalConstituencyId] = useState<string | null>(null)
  const [lgaId, setLgaId] = useState<string | null>(null)
  const [wardId, setWardId] = useState<string | null>(null)
  const [pollingUnitId, setPollingUnitId] = useState<string | null>(null)

  // Gender and Profession filters
  const [genderFilter, setGenderFilter] = useState<string | null>(null)
  const [professionFilter, setProfessionFilter] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch movements (for selecting organization)
  const { data: movementsData } = useQuery(GET_MOVEMENTS, {
    variables: { filter: { isActive: true } },
  })

  // Fetch location data
  const { data: countriesData } = useQuery(GET_COUNTRIES)
  const { data: geoZonesData } = useQuery(GET_GEOPOLITICAL_ZONES, {
    variables: { countryId },
    skip: !countryId,
  })
  const { data: statesData } = useQuery(GET_STATES, {
    variables: { countryId },
    skip: !countryId,
  })
  const { data: senatorialZonesData } = useQuery(GET_SENATORIAL_ZONES, {
    variables: { stateId },
    skip: !stateId,
  })
  const { data: federalConstData } = useQuery(GET_FEDERAL_CONSTITUENCIES, {
    variables: { stateId },
    skip: !stateId,
  })
  const { data: lgasData } = useQuery(GET_LGAS, {
    variables: {
      stateId,
      senatorialZoneId: senatorialZoneId || undefined,
      federalConstituencyId: federalConstituencyId || undefined,
    },
    skip: !stateId,
  })
  const { data: wardsData } = useQuery(GET_WARDS, {
    variables: { lgaId },
    skip: !lgaId,
  })
  const { data: pollingUnitsData } = useQuery(GET_POLLING_UNITS, {
    variables: { wardId },
    skip: !wardId,
  })

  const movements = movementsData?.movements || []
  const countries = countriesData?.countries || []
  const geoZones = geoZonesData?.geopoliticalZones || []
  const states = statesData?.states || []
  const senatorialZones = senatorialZonesData?.senatorialZones || []
  const federalConstituencies = federalConstData?.federalConstituencies || []
  const lgas = lgasData?.lgas || []
  const wards = wardsData?.wards || []
  const pollingUnits = pollingUnitsData?.pollingUnits || []

  const { data, loading, error } = useQuery(GET_ORG_MEMBERS, {
    variables: {
      orgId: selectedOrgId || '',
      search: debouncedSearch || undefined,
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
    },
    skip: !selectedOrgId,
    fetchPolicy: 'cache-and-network',
  })

  // Client-side filtering for gender and profession
  let filteredMembers = data?.getOrgMembers || []

  if (genderFilter) {
    filteredMembers = filteredMembers.filter((m: OrgMember) => m.user.gender === genderFilter)
  }

  if (professionFilter) {
    filteredMembers = filteredMembers.filter((m: OrgMember) => m.user.profession === professionFilter)
  }

  // Sort alphabetically by surname (lastName)
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const lastNameA = (a.user.lastName || '').toLowerCase()
    const lastNameB = (b.user.lastName || '').toLowerCase()
    return lastNameA.localeCompare(lastNameB)
  })

  // Extract unique professions from members for filter dropdown
  const uniqueProfessions = Array.from(
    new Set(
      (data?.getOrgMembers || [])
        .map((m: OrgMember) => m.user.profession)
        .filter(Boolean)
    )
  ).sort()

  const members = sortedMembers
  const totalCount = members.length
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const startItem = totalCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount)

  // Determine if the current user is a Support Group Admin for the selected organization
  // Platform Admin and Super Admin should NOT see action buttons (read-only view)
  // Only Support Group Admin should see action buttons
  const currentUserMembership = useMemo(() => {
    if (!user?.id || !selectedOrgId || !data?.getOrgMembers) return null
    return (data.getOrgMembers as OrgMember[]).find((m: OrgMember) => m.userId === user.id)
  }, [user?.id, selectedOrgId, data?.getOrgMembers])

  const isSupportGroupAdmin = useMemo(() => {
    // Platform Admin and Super Admin should NOT see action buttons
    if (isPlatformAdmin || isSuperAdmin) return false
    // Only show actions if user is an admin of this specific organization
    return currentUserMembership?.isAdmin === true
  }, [isPlatformAdmin, isSuperAdmin, currentUserMembership])

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  const filterSection = (
    <div className="space-y-4">
      {/* Organization Selection */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Movement</Label>
          <Select
            value={movementId || 'none'}
            onValueChange={(value) => {
              setMovementId(value === 'none' ? null : value)
              setSelectedOrgId(null)
              handleFilterChange()
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Movement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select Movement</SelectItem>
              {movements.map((movement: any) => (
                <SelectItem key={movement.id} value={movement.id}>
                  {movement.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Organization (Required)</Label>
          <Select
            value={selectedOrgId || 'none'}
            onValueChange={(value) => {
              setSelectedOrgId(value === 'none' ? null : value)
              handleFilterChange()
            }}
            disabled={!movementId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select Organization</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          disabled={!selectedOrgId}
        />
      </div>

      {/* Gender and Profession Filters */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select
            value={genderFilter || 'all'}
            onValueChange={(value) => {
              setGenderFilter(value === 'all' ? null : value)
              setCurrentPage(1)
            }}
            disabled={!selectedOrgId}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Profession</Label>
          <Select
            value={professionFilter || 'all'}
            onValueChange={(value) => {
              setProfessionFilter(value === 'all' ? null : value)
              setCurrentPage(1)
            }}
            disabled={!selectedOrgId}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Professions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Professions</SelectItem>
              {uniqueProfessions.map((profession: string) => (
                <SelectItem key={profession} value={profession}>
                  {profession}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location Filters */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Filter by Location (Optional)</Label>

        {/* Row 1: Country, Geopolitical Zone, State */}
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            value={countryId || 'all'}
            onValueChange={(value) => {
              setCountryId(value === 'all' ? null : value)
              setGeopoliticalZoneId(null)
              setStateId(null)
              setSenatorialZoneId(null)
              setFederalConstituencyId(null)
              setLgaId(null)
              setWardId(null)
              setPollingUnitId(null)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Country" />
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

          <Select
            value={geopoliticalZoneId || 'all'}
            onValueChange={(value) => setGeopoliticalZoneId(value === 'all' ? null : value)}
            disabled={!countryId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Geopolitical Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {geoZones.map((zone: any) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={stateId || 'all'}
            onValueChange={(value) => {
              setStateId(value === 'all' ? null : value)
              setSenatorialZoneId(null)
              setFederalConstituencyId(null)
              setLgaId(null)
              setWardId(null)
              setPollingUnitId(null)
            }}
            disabled={!countryId}
          >
            <SelectTrigger>
              <SelectValue placeholder="State" />
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

        {/* Row 2: Senatorial Zone, Federal Constituency, LGA */}
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            value={senatorialZoneId || 'all'}
            onValueChange={(value) => {
              setSenatorialZoneId(value === 'all' ? null : value)
              setLgaId(null)
              setWardId(null)
              setPollingUnitId(null)
            }}
            disabled={!stateId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Senatorial Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Senatorial Zones</SelectItem>
              {senatorialZones.map((zone: any) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={federalConstituencyId || 'all'}
            onValueChange={(value) => {
              setFederalConstituencyId(value === 'all' ? null : value)
              setLgaId(null)
              setWardId(null)
              setPollingUnitId(null)
            }}
            disabled={!stateId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Federal Constituency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Constituencies</SelectItem>
              {federalConstituencies.map((fc: any) => (
                <SelectItem key={fc.id} value={fc.id}>
                  {fc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={lgaId || 'all'}
            onValueChange={(value) => {
              setLgaId(value === 'all' ? null : value)
              setWardId(null)
              setPollingUnitId(null)
            }}
            disabled={!stateId}
          >
            <SelectTrigger>
              <SelectValue placeholder="LGA" />
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

        {/* Row 3: Ward, Polling Unit */}
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            value={wardId || 'all'}
            onValueChange={(value) => {
              setWardId(value === 'all' ? null : value)
              setPollingUnitId(null)
            }}
            disabled={!lgaId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ward" />
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

          <Select
            value={pollingUnitId || 'all'}
            onValueChange={(value) => setPollingUnitId(value === 'all' ? null : value)}
            disabled={!wardId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Polling Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Polling Units</SelectItem>
              {pollingUnits.map((pu: any) => (
                <SelectItem key={pu.id} value={pu.id}>
                  {pu.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  const paginationSection = totalPages > 1 && (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalCount} members
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage === 1 || loading}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number
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
                disabled={loading}
                className="w-9"
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage === totalPages || loading}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <ListPageTemplate
      title="Members"
      description="Manage and view all members in your organization"
      filters={filterSection}
      pagination={paginationSection}
    >
      <Card>
        <CardContent className="pt-6">
          {!selectedOrgId ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Please select an organization to view members</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Error loading members: {error.message}</p>
            </div>
          ) : loading && !data ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No members found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Member</th>
                      <th className="text-left p-3 font-semibold">Gender</th>
                      <th className="text-left p-3 font-semibold">Phone</th>
                      <th className="text-left p-3 font-semibold">Profession</th>
                      <th className="text-left p-3 font-semibold">Location</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Role</th>
                      <th className="text-left p-3 font-semibold">Joined</th>
                      {isSupportGroupAdmin && <th className="text-left p-3 font-semibold">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member: OrgMember) => (
                      <tr key={member.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3">
                          <Link href={`/admin/members/${member.userId}`} className="block">
                            <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                              <Avatar>
                                <AvatarImage src={member.user.avatar} alt={`${member.user.firstName} ${member.user.lastName}`} />
                                <AvatarFallback>
                                  {`${member.user.firstName?.[0] || ''}${member.user.lastName?.[0] || ''}`.toUpperCase() || '??'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-primary hover:underline">
                                  {member.user.firstName} <span className="font-bold">{member.user.lastName}</span>
                                </div>
                                {member.user.displayName && (
                                  <div className="text-sm text-muted-foreground">
                                    @{member.user.displayName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="p-3">
                          <div className="text-sm capitalize">
                            {member.user.gender ? member.user.gender.toLowerCase().replace('_', ' ') : '-'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {member.user.phoneNumber || '-'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {member.user.profession || '-'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {member.user.state?.name && member.user.lga?.name ? (
                              <>
                                <div>{member.user.state.name}</div>
                                <div className="text-xs text-muted-foreground">{member.user.lga.name}</div>
                              </>
                            ) : member.user.state?.name ? (
                              <div>{member.user.state.name}</div>
                            ) : member.user.lga?.name ? (
                              <div>{member.user.lga.name}</div>
                            ) : (
                              <div className="text-muted-foreground">-</div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            {member.isBlocked ? (
                              <Badge variant="destructive" className="w-fit">Blocked</Badge>
                            ) : member.isActive ? (
                              <Badge variant="default" className="w-fit bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="w-fit">Inactive</Badge>
                            )}
                            {member.isVerified && (
                              <Badge variant="outline" className="w-fit text-xs">Verified</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            {member.isAdmin && (
                              <Badge variant="default" className="w-fit">Admin</Badge>
                            )}
                            {member.isLeader && (
                              <Badge variant="secondary" className="w-fit">
                                <Crown className="h-3 w-3 mr-1" />
                                Leader
                              </Badge>
                            )}
                            {member.isChairman && (
                              <Badge variant="secondary" className="w-fit">Chairman</Badge>
                            )}
                            {!member.isAdmin && !member.isLeader && !member.isChairman && (
                              <Badge variant="outline" className="w-fit">Member</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(member.joinedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        {isSupportGroupAdmin && (
                          <td className="p-3">
                            <div className="flex gap-2">
                              {member.isBlocked ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  Unblock
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                  >
                                    <UserX className="h-4 w-4" />
                                    Block
                                  </Button>
                                  {!member.isLeader && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-2"
                                    >
                                      <Crown className="h-4 w-4" />
                                      Make Leader
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </ListPageTemplate>
  )
}

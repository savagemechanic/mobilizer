'use client'

import { useEffect } from 'react'
import { useQuery } from '@apollo/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Label } from '@/ui/label'
import { GET_MOVEMENTS } from '@/lib/graphql/queries/platform-admin'
import { GET_SUPPORT_GROUPS } from '@/lib/graphql/queries/admin'
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
import { Gender } from '@mobilizer/shared'
import { useAuthStore } from '@/store/auth-store'
import { useUserRoles, getUserAdminScope } from '@/hooks/use-user-roles'

interface DashboardFiltersProps {
  movementId: string | null
  supportGroupId: string | null
  countryId: string | null
  geopoliticalZoneId?: string | null
  stateId: string | null
  senatorialZoneId?: string | null
  federalConstituencyId?: string | null
  lgaId: string | null
  wardId: string | null
  pollingUnitId: string | null
  gender?: string | null
  profession?: string | null
  onMovementChange: (value: string | null) => void
  onSupportGroupChange: (value: string | null) => void
  onCountryChange: (value: string | null) => void
  onGeopoliticalZoneChange?: (value: string | null) => void
  onStateChange: (value: string | null) => void
  onSenatorialZoneChange?: (value: string | null) => void
  onFederalConstituencyChange?: (value: string | null) => void
  onLgaChange: (value: string | null) => void
  onWardChange: (value: string | null) => void
  onPollingUnitChange: (value: string | null) => void
  onGenderChange?: (value: string | null) => void
  onProfessionChange?: (value: string | null) => void
  showZoneFilters?: boolean
}

// Common professions list
const COMMON_PROFESSIONS = [
  'Student',
  'Teacher',
  'Doctor',
  'Engineer',
  'Lawyer',
  'Business Owner',
  'Civil Servant',
  'Farmer',
  'Trader',
  'Artisan',
  'Unemployed',
  'Retired',
  'Other',
]

export function DashboardFilters({
  movementId,
  supportGroupId,
  countryId,
  geopoliticalZoneId,
  stateId,
  senatorialZoneId,
  federalConstituencyId,
  lgaId,
  wardId,
  pollingUnitId,
  gender,
  profession,
  onMovementChange,
  onSupportGroupChange,
  onCountryChange,
  onGeopoliticalZoneChange,
  onStateChange,
  onSenatorialZoneChange,
  onFederalConstituencyChange,
  onLgaChange,
  onWardChange,
  onPollingUnitChange,
  onGenderChange,
  onProfessionChange,
  showZoneFilters = true,
}: DashboardFiltersProps) {
  // Get current user and their roles
  const user = useAuthStore((state) => state.user)
  const { userRoles, loading: rolesLoading } = useUserRoles()
  const adminScope = getUserAdminScope(user, userRoles)

  // Auto-select filters based on user role on mount
  useEffect(() => {
    if (rolesLoading || !user) return

    // Super Admin: auto-select their movement
    if (adminScope.isSuperAdmin && adminScope.movementId && !movementId) {
      onMovementChange(adminScope.movementId)
    }

    // Support Group Admin: auto-select movement and support group
    if (adminScope.isSupportGroupAdmin && adminScope.supportGroupId && !supportGroupId) {
      if (adminScope.movementId) {
        onMovementChange(adminScope.movementId)
      }
      // Wait a tick for movement to load support groups
      setTimeout(() => {
        if (adminScope.supportGroupId) {
          onSupportGroupChange(adminScope.supportGroupId)
        }
      }, 100)
    }
  }, [
    rolesLoading,
    user,
    adminScope.isSuperAdmin,
    adminScope.isSupportGroupAdmin,
    adminScope.movementId,
    adminScope.supportGroupId,
  ])

  // Fetch movements
  const { data: movementsData, loading: movementsLoading } = useQuery(GET_MOVEMENTS, {
    variables: { filter: { isActive: true } },
  })

  // Fetch support groups for selected movement
  const { data: supportGroupsData, loading: supportGroupsLoading } = useQuery(GET_SUPPORT_GROUPS, {
    variables: { filter: { movementId } },
    skip: !movementId,
  })

  // Fetch countries
  const { data: countriesData, loading: countriesLoading } = useQuery(GET_COUNTRIES)

  // Fetch geopolitical zones for selected country
  const { data: geoZonesData, loading: geoZonesLoading } = useQuery(GET_GEOPOLITICAL_ZONES, {
    variables: { countryId },
    skip: !countryId || !showZoneFilters,
  })

  // Fetch states for selected country
  const { data: statesData, loading: statesLoading } = useQuery(GET_STATES, {
    variables: { countryId },
    skip: !countryId,
  })

  // Fetch senatorial zones for selected state
  const { data: senatorialZonesData, loading: senatorialZonesLoading } = useQuery(GET_SENATORIAL_ZONES, {
    variables: { stateId },
    skip: !stateId || !showZoneFilters,
  })

  // Fetch federal constituencies for selected state
  const { data: federalConstData, loading: federalConstLoading } = useQuery(GET_FEDERAL_CONSTITUENCIES, {
    variables: { stateId },
    skip: !stateId || !showZoneFilters,
  })

  // Fetch LGAs for selected state (or filtered by zone)
  const { data: lgasData, loading: lgasLoading } = useQuery(GET_LGAS, {
    variables: {
      stateId,
      senatorialZoneId: senatorialZoneId || undefined,
      federalConstituencyId: federalConstituencyId || undefined,
    },
    skip: !stateId,
  })

  // Fetch wards for selected LGA
  const { data: wardsData, loading: wardsLoading } = useQuery(GET_WARDS, {
    variables: { lgaId },
    skip: !lgaId,
  })

  // Fetch polling units for selected ward
  const { data: pollingUnitsData, loading: pollingUnitsLoading } = useQuery(GET_POLLING_UNITS, {
    variables: { wardId },
    skip: !wardId,
  })

  const movements = movementsData?.movements || []
  const supportGroups = supportGroupsData?.organizations || []
  const countries = countriesData?.countries || []
  const geoZones = geoZonesData?.geopoliticalZones || []
  const states = statesData?.states || []
  const senatorialZones = senatorialZonesData?.senatorialZones || []
  const federalConstituencies = federalConstData?.federalConstituencies || []
  const lgas = lgasData?.lgas || []
  const wards = wardsData?.wards || []
  const pollingUnits = pollingUnitsData?.pollingUnits || []

  const handleMovementChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    onMovementChange(newValue)
    onSupportGroupChange(null)
  }

  const handleSupportGroupChange = (value: string) => {
    onSupportGroupChange(value === 'all' ? null : value)
  }

  const handleCountryChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    onCountryChange(newValue)
    onGeopoliticalZoneChange?.(null)
    onStateChange(null)
    onSenatorialZoneChange?.(null)
    onFederalConstituencyChange?.(null)
    onLgaChange(null)
    onWardChange(null)
    onPollingUnitChange(null)
  }

  const handleGeopoliticalZoneChange = (value: string) => {
    onGeopoliticalZoneChange?.(value === 'all' ? null : value)
  }

  const handleStateChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    onStateChange(newValue)
    onSenatorialZoneChange?.(null)
    onFederalConstituencyChange?.(null)
    onLgaChange(null)
    onWardChange(null)
    onPollingUnitChange(null)
  }

  const handleSenatorialZoneChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    onSenatorialZoneChange?.(newValue)
    onLgaChange(null)
    onWardChange(null)
    onPollingUnitChange(null)
  }

  const handleFederalConstituencyChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    onFederalConstituencyChange?.(newValue)
    onLgaChange(null)
    onWardChange(null)
    onPollingUnitChange(null)
  }

  const handleLgaChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    onLgaChange(newValue)
    onWardChange(null)
    onPollingUnitChange(null)
  }

  const handleWardChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    onWardChange(newValue)
    onPollingUnitChange(null)
  }

  const handlePollingUnitChange = (value: string) => {
    onPollingUnitChange(value === 'all' ? null : value)
  }

  const handleGenderChange = (value: string) => {
    onGenderChange?.(value === 'all' ? null : value)
  }

  const handleProfessionChange = (value: string) => {
    onProfessionChange?.(value === 'all' ? null : value)
  }

  // Determine if movement filter should be disabled/hidden
  const shouldDisableMovementFilter = Boolean(
    !adminScope.isPlatformAdmin && adminScope.isSuperAdmin && adminScope.movementId
  )

  // Determine if support group filter should be disabled/hidden
  const shouldDisableSupportGroupFilter = Boolean(
    !adminScope.isPlatformAdmin &&
    adminScope.isSupportGroupAdmin &&
    adminScope.supportGroupId
  )

  // Show movement and support group filters
  const showMovementFilter = !shouldDisableSupportGroupFilter || adminScope.isPlatformAdmin || adminScope.isSuperAdmin
  const showSupportGroupFilter = true

  return (
    <div className="space-y-4">
      {/* Primary Filters Row: Movement -> Support Group */}
      {(showMovementFilter || showSupportGroupFilter) && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Movement Filter */}
          {showMovementFilter && (
            <div className="space-y-2">
              <Label htmlFor="movement">Movement</Label>
              <Select
                value={movementId || 'all'}
                onValueChange={handleMovementChange}
                disabled={movementsLoading || shouldDisableMovementFilter}
              >
                <SelectTrigger id="movement">
                  <SelectValue placeholder="Select Movement" />
                </SelectTrigger>
                <SelectContent>
                  {adminScope.isPlatformAdmin && <SelectItem value="all">All Movements</SelectItem>}
                  {movements.map((movement: any) => (
                    <SelectItem key={movement.id} value={movement.id}>
                      {movement.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Support Group Filter */}
          {showSupportGroupFilter && (
            <div className="space-y-2">
              <Label htmlFor="supportGroup">Support Group</Label>
              <Select
                value={supportGroupId || 'all'}
                onValueChange={handleSupportGroupChange}
                disabled={!movementId || supportGroupsLoading || shouldDisableSupportGroupFilter}
              >
                <SelectTrigger id="supportGroup">
                  <SelectValue placeholder="Select Support Group" />
                </SelectTrigger>
                <SelectContent>
                  {(adminScope.isPlatformAdmin || adminScope.isSuperAdmin) && (
                    <SelectItem value="all">All Support Groups</SelectItem>
                  )}
                  {supportGroups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Location Filters Row 1: Country -> Geopolitical Zone -> State */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Country Filter */}
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select
            value={countryId || 'all'}
            onValueChange={handleCountryChange}
            disabled={countriesLoading}
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Select Country" />
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

        {/* Geopolitical Zone Filter (Nigeria specific) */}
        {showZoneFilters && (
          <div className="space-y-2">
            <Label htmlFor="geoZone">Geopolitical Zone</Label>
            <Select
              value={geopoliticalZoneId || 'all'}
              onValueChange={handleGeopoliticalZoneChange}
              disabled={!countryId || geoZonesLoading}
            >
              <SelectTrigger id="geoZone">
                <SelectValue placeholder="Select Zone" />
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
          </div>
        )}

        {/* State Filter */}
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select
            value={stateId || 'all'}
            onValueChange={handleStateChange}
            disabled={!countryId || statesLoading}
          >
            <SelectTrigger id="state">
              <SelectValue placeholder="Select State" />
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
      </div>

      {/* Location Filters Row 2: Senatorial Zone -> Federal Constituency -> LGA */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Senatorial Zone Filter */}
        {showZoneFilters && (
          <div className="space-y-2">
            <Label htmlFor="senatorialZone">Senatorial Zone</Label>
            <Select
              value={senatorialZoneId || 'all'}
              onValueChange={handleSenatorialZoneChange}
              disabled={!stateId || senatorialZonesLoading}
            >
              <SelectTrigger id="senatorialZone">
                <SelectValue placeholder="Select Senatorial Zone" />
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
          </div>
        )}

        {/* Federal Constituency Filter */}
        {showZoneFilters && (
          <div className="space-y-2">
            <Label htmlFor="federalConst">Federal Constituency</Label>
            <Select
              value={federalConstituencyId || 'all'}
              onValueChange={handleFederalConstituencyChange}
              disabled={!stateId || federalConstLoading}
            >
              <SelectTrigger id="federalConst">
                <SelectValue placeholder="Select Constituency" />
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
          </div>
        )}

        {/* LGA Filter */}
        <div className="space-y-2">
          <Label htmlFor="lga">LGA</Label>
          <Select
            value={lgaId || 'all'}
            onValueChange={handleLgaChange}
            disabled={!stateId || lgasLoading}
          >
            <SelectTrigger id="lga">
              <SelectValue placeholder="Select LGA" />
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
      </div>

      {/* Location Filters Row 3: Ward -> Polling Unit */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Ward Filter */}
        <div className="space-y-2">
          <Label htmlFor="ward">Ward</Label>
          <Select
            value={wardId || 'all'}
            onValueChange={handleWardChange}
            disabled={!lgaId || wardsLoading}
          >
            <SelectTrigger id="ward">
              <SelectValue placeholder="Select Ward" />
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

        {/* Polling Unit Filter */}
        <div className="space-y-2">
          <Label htmlFor="pollingUnit">Polling Unit</Label>
          <Select
            value={pollingUnitId || 'all'}
            onValueChange={handlePollingUnitChange}
            disabled={!wardId || pollingUnitsLoading}
          >
            <SelectTrigger id="pollingUnit">
              <SelectValue placeholder="Select Polling Unit" />
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

      {/* Demographic Filters Row: Gender -> Profession */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gender Filter */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={gender || 'all'}
            onValueChange={handleGenderChange}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value={Gender.MALE}>Male</SelectItem>
              <SelectItem value={Gender.FEMALE}>Female</SelectItem>
              <SelectItem value={Gender.OTHER}>Other</SelectItem>
              <SelectItem value={Gender.PREFER_NOT_TO_SAY}>Not Specified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profession Filter */}
        <div className="space-y-2">
          <Label htmlFor="profession">Profession</Label>
          <Select
            value={profession || 'all'}
            onValueChange={handleProfessionChange}
          >
            <SelectTrigger id="profession">
              <SelectValue placeholder="Select Profession" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {COMMON_PROFESSIONS.map((prof) => (
                <SelectItem key={prof} value={prof}>
                  {prof}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

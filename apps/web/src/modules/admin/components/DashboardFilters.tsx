'use client'

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
  GET_STATES,
  GET_LGAS,
  GET_WARDS,
  GET_POLLING_UNITS,
} from '@/lib/graphql/queries/locations'

interface DashboardFiltersProps {
  movementId: string | null
  supportGroupId: string | null
  countryId: string | null
  stateId: string | null
  lgaId: string | null
  wardId: string | null
  pollingUnitId: string | null
  onMovementChange: (value: string | null) => void
  onSupportGroupChange: (value: string | null) => void
  onCountryChange: (value: string | null) => void
  onStateChange: (value: string | null) => void
  onLgaChange: (value: string | null) => void
  onWardChange: (value: string | null) => void
  onPollingUnitChange: (value: string | null) => void
}

export function DashboardFilters({
  movementId,
  supportGroupId,
  countryId,
  stateId,
  lgaId,
  wardId,
  pollingUnitId,
  onMovementChange,
  onSupportGroupChange,
  onCountryChange,
  onStateChange,
  onLgaChange,
  onWardChange,
  onPollingUnitChange,
}: DashboardFiltersProps) {
  // Fetch movements
  const { data: movementsData, loading: movementsLoading } = useQuery(GET_MOVEMENTS, {
    variables: { filter: { isActive: true } },
  })

  // Fetch support groups for selected movement
  const { data: supportGroupsData, loading: supportGroupsLoading } = useQuery(GET_SUPPORT_GROUPS, {
    variables: { movementId },
    skip: !movementId,
  })

  // Fetch countries
  const { data: countriesData, loading: countriesLoading } = useQuery(GET_COUNTRIES)

  // Fetch states for selected country
  const { data: statesData, loading: statesLoading } = useQuery(GET_STATES, {
    variables: { countryId },
    skip: !countryId,
  })

  // Fetch LGAs for selected state
  const { data: lgasData, loading: lgasLoading } = useQuery(GET_LGAS, {
    variables: { stateId },
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
  const states = statesData?.states || []
  const lgas = lgasData?.lgas || []
  const wards = wardsData?.wards || []
  const pollingUnits = pollingUnitsData?.pollingUnits || []

  const handleMovementChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    onMovementChange(newValue)
    // Reset dependent filters
    onSupportGroupChange(null)
  }

  const handleSupportGroupChange = (value: string) => {
    onSupportGroupChange(value === 'all' ? null : value)
  }

  const handleCountryChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    onCountryChange(newValue)
    // Reset dependent filters
    onStateChange(null)
    onLgaChange(null)
    onWardChange(null)
    onPollingUnitChange(null)
  }

  const handleStateChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    onStateChange(newValue)
    // Reset dependent filters
    onLgaChange(null)
    onWardChange(null)
    onPollingUnitChange(null)
  }

  const handleLgaChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    onLgaChange(newValue)
    // Reset dependent filters
    onWardChange(null)
    onPollingUnitChange(null)
  }

  const handleWardChange = (value: string) => {
    const newValue = value === 'all' ? null : value
    onWardChange(newValue)
    // Reset dependent filter
    onPollingUnitChange(null)
  }

  const handlePollingUnitChange = (value: string) => {
    onPollingUnitChange(value === 'all' ? null : value)
  }

  return (
    <div className="space-y-4">
      {/* Primary Filters Row: Movement -> Support Group */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Movement Filter */}
        <div className="space-y-2">
          <Label htmlFor="movement">Movement</Label>
          <Select
            value={movementId || 'all'}
            onValueChange={handleMovementChange}
            disabled={movementsLoading}
          >
            <SelectTrigger id="movement">
              <SelectValue placeholder="Select Movement" />
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

        {/* Support Group Filter */}
        <div className="space-y-2">
          <Label htmlFor="supportGroup">Support Group</Label>
          <Select
            value={supportGroupId || 'all'}
            onValueChange={handleSupportGroupChange}
            disabled={!movementId || supportGroupsLoading}
          >
            <SelectTrigger id="supportGroup">
              <SelectValue placeholder="Select Support Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Support Groups</SelectItem>
              {supportGroups.map((group: any) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location Filters Row */}
      <div className="grid gap-4 md:grid-cols-5">
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
    </div>
  )
}

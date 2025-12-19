import { useState } from 'react'

export interface DashboardFilterState {
  movementId: string | null
  supportGroupId: string | null
  countryId: string | null
  stateId: string | null
  lgaId: string | null
  wardId: string | null
  pollingUnitId: string | null
}

export interface OrgFilter {
  supportGroupId?: string
  countryId?: string
  stateId?: string
  lgaId?: string
  wardId?: string
  pollingUnitId?: string
}

export function useDashboardFilters() {
  const [filters, setFilters] = useState<DashboardFilterState>({
    movementId: null,
    supportGroupId: null,
    countryId: null,
    stateId: null,
    lgaId: null,
    wardId: null,
    pollingUnitId: null,
  })

  const setMovementId = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      movementId: value,
      // Reset dependent filters
      supportGroupId: null,
    }))
  }

  const setSupportGroupId = (value: string | null) => {
    setFilters((prev) => ({ ...prev, supportGroupId: value }))
  }

  const setCountryId = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      countryId: value,
      // Reset dependent filters
      stateId: null,
      lgaId: null,
      wardId: null,
      pollingUnitId: null,
    }))
  }

  const setStateId = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      stateId: value,
      // Reset dependent filters
      lgaId: null,
      wardId: null,
      pollingUnitId: null,
    }))
  }

  const setLgaId = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      lgaId: value,
      // Reset dependent filters
      wardId: null,
      pollingUnitId: null,
    }))
  }

  const setWardId = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      wardId: value,
      // Reset dependent filter
      pollingUnitId: null,
    }))
  }

  const setPollingUnitId = (value: string | null) => {
    setFilters((prev) => ({ ...prev, pollingUnitId: value }))
  }

  const resetFilters = () => {
    setFilters({
      movementId: null,
      supportGroupId: null,
      countryId: null,
      stateId: null,
      lgaId: null,
      wardId: null,
      pollingUnitId: null,
    })
  }

  // Build org filter object for GraphQL queries
  const getOrgFilter = (): OrgFilter | null => {
    const orgFilter: OrgFilter = {}

    if (filters.supportGroupId) orgFilter.supportGroupId = filters.supportGroupId
    if (filters.countryId) orgFilter.countryId = filters.countryId
    if (filters.stateId) orgFilter.stateId = filters.stateId
    if (filters.lgaId) orgFilter.lgaId = filters.lgaId
    if (filters.wardId) orgFilter.wardId = filters.wardId
    if (filters.pollingUnitId) orgFilter.pollingUnitId = filters.pollingUnitId

    return Object.keys(orgFilter).length > 0 ? orgFilter : null
  }

  return {
    filters,
    setMovementId,
    setSupportGroupId,
    setCountryId,
    setStateId,
    setLgaId,
    setWardId,
    setPollingUnitId,
    resetFilters,
    getOrgFilter,
  }
}

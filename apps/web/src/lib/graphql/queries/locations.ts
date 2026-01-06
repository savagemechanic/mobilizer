import { gql } from '@apollo/client'

export const GET_COUNTRIES = gql`
  query GetCountries {
    countries {
      id
      name
      code
    }
  }
`

export const GET_GEOPOLITICAL_ZONES = gql`
  query GetGeopoliticalZones($countryId: String) {
    geopoliticalZones(countryId: $countryId) {
      id
      name
      code
      countryId
    }
  }
`

export const GET_STATES = gql`
  query GetStates($countryId: String) {
    states(countryId: $countryId) {
      id
      name
      code
      countryId
    }
  }
`

export const GET_SENATORIAL_ZONES = gql`
  query GetSenatorialZones($stateId: String) {
    senatorialZones(stateId: $stateId) {
      id
      name
      code
      stateId
    }
  }
`

export const GET_FEDERAL_CONSTITUENCIES = gql`
  query GetFederalConstituencies($stateId: String) {
    federalConstituencies(stateId: $stateId) {
      id
      name
      code
      stateId
    }
  }
`

export const GET_LGAS = gql`
  query GetLGAs($stateId: String, $senatorialZoneId: String, $federalConstituencyId: String) {
    lgas(stateId: $stateId, senatorialZoneId: $senatorialZoneId, federalConstituencyId: $federalConstituencyId) {
      id
      name
      code
      stateId
      senatorialZoneId
      federalConstituencyId
    }
  }
`

export const GET_WARDS = gql`
  query GetWards($lgaId: String) {
    wards(lgaId: $lgaId) {
      id
      name
      code
      lgaId
    }
  }
`

export const GET_POLLING_UNITS = gql`
  query GetPollingUnits($wardId: String) {
    pollingUnits(wardId: $wardId) {
      id
      name
      code
      wardId
    }
  }
`

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

export const GET_LGAS = gql`
  query GetLGAs($stateId: String) {
    lgas(stateId: $stateId) {
      id
      name
      code
      stateId
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

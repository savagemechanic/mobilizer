import { gql } from '@apollo/client';

/**
 * Fragment for Country
 */
export const COUNTRY_FRAGMENT = gql`
  fragment CountryFields on Country {
    id
    name
    code
    createdAt
  }
`;

/**
 * Fragment for State
 */
export const STATE_FRAGMENT = gql`
  fragment StateFields on State {
    id
    name
    code
    countryId
    createdAt
  }
`;

/**
 * Fragment for LGA (Local Government Area)
 */
export const LGA_FRAGMENT = gql`
  fragment LGAFields on LGA {
    id
    name
    code
    stateId
    createdAt
  }
`;

/**
 * Fragment for Ward
 */
export const WARD_FRAGMENT = gql`
  fragment WardFields on Ward {
    id
    name
    code
    lgaId
    createdAt
  }
`;

/**
 * Fragment for Polling Unit
 */
export const POLLING_UNIT_FRAGMENT = gql`
  fragment PollingUnitFields on PollingUnit {
    id
    name
    code
    wardId
    createdAt
  }
`;

/**
 * Query to fetch all countries
 */
export const GET_COUNTRIES = gql`
  ${COUNTRY_FRAGMENT}
  query GetCountries {
    countries {
      ...CountryFields
    }
  }
`;

/**
 * Query to fetch a single country
 */
export const GET_COUNTRY = gql`
  ${COUNTRY_FRAGMENT}
  query GetCountry($id: String!) {
    country(id: $id) {
      ...CountryFields
    }
  }
`;

/**
 * Query to fetch states (optionally filtered by country)
 */
export const GET_STATES = gql`
  ${STATE_FRAGMENT}
  query GetStates($countryId: String) {
    states(countryId: $countryId) {
      ...StateFields
    }
  }
`;

/**
 * Query to fetch a single state
 */
export const GET_STATE = gql`
  ${STATE_FRAGMENT}
  query GetState($id: String!) {
    state(id: $id) {
      ...StateFields
    }
  }
`;

/**
 * Query to fetch LGAs (optionally filtered by state)
 */
export const GET_LGAS = gql`
  ${LGA_FRAGMENT}
  query GetLGAs($stateId: String) {
    lgas(stateId: $stateId) {
      ...LGAFields
    }
  }
`;

/**
 * Query to fetch a single LGA
 */
export const GET_LGA = gql`
  ${LGA_FRAGMENT}
  query GetLGA($id: String!) {
    lga(id: $id) {
      ...LGAFields
    }
  }
`;

/**
 * Query to fetch wards (optionally filtered by LGA)
 */
export const GET_WARDS = gql`
  ${WARD_FRAGMENT}
  query GetWards($lgaId: String) {
    wards(lgaId: $lgaId) {
      ...WardFields
    }
  }
`;

/**
 * Query to fetch a single ward
 */
export const GET_WARD = gql`
  ${WARD_FRAGMENT}
  query GetWard($id: String!) {
    ward(id: $id) {
      ...WardFields
    }
  }
`;

/**
 * Query to fetch polling units (optionally filtered by ward)
 */
export const GET_POLLING_UNITS = gql`
  ${POLLING_UNIT_FRAGMENT}
  query GetPollingUnits($wardId: String) {
    pollingUnits(wardId: $wardId) {
      ...PollingUnitFields
    }
  }
`;

/**
 * Query to fetch a single polling unit
 */
export const GET_POLLING_UNIT = gql`
  ${POLLING_UNIT_FRAGMENT}
  query GetPollingUnit($id: String!) {
    pollingUnit(id: $id) {
      ...PollingUnitFields
    }
  }
`;

/**
 * Query to lookup location by composite code (e.g., "24/07/05/003")
 * Returns the full location hierarchy if valid
 */
export const LOOKUP_LOCATION_BY_CODE = gql`
  query LookupLocationByCode($code: String!) {
    lookupLocationByCode(code: $code) {
      valid
      error
      state {
        id
        name
        code
      }
      lga {
        id
        name
        code
        stateId
      }
      ward {
        id
        name
        code
        lgaId
      }
      pollingUnit {
        id
        name
        code
        wardId
      }
    }
  }
`;

/**
 * Query to fetch leaders for a specific location
 */
export const GET_LOCATION_LEADERS = gql`
  query GetLocationLeaders($locationId: String!, $locationType: String!) {
    locationLeaders(locationId: $locationId, locationType: $locationType) {
      id
      firstName
      lastName
      displayName
      avatar
      role
    }
  }
`;

/**
 * Query to fetch statistics for a specific location
 */
export const GET_LOCATION_STATS = gql`
  query GetLocationStats($locationId: String!, $locationType: String!) {
    locationStats(locationId: $locationId, locationType: $locationType) {
      memberCount
      postCount
      eventCount
    }
  }
`;

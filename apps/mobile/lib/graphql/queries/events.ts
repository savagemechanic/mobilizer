import { gql } from '@apollo/client';

/**
 * Fragment for event information
 */
export const EVENT_FRAGMENT = gql`
  fragment EventFields on EventEntity {
    id
    title
    description
    type
    startTime
    endTime
    location
    isVirtual
    virtualLink
    banner
    isPublished
    orgId
    creatorId
    createdAt
    updatedAt
  }
`;

/**
 * Query to fetch events with filters
 */
export const GET_EVENTS = gql`
  ${EVENT_FRAGMENT}
  query GetEvents($orgId: String, $limit: Float, $offset: Float) {
    events(orgId: $orgId, limit: $limit, offset: $offset) {
      ...EventFields
    }
  }
`;

/**
 * Query to fetch a single event
 */
export const GET_EVENT = gql`
  ${EVENT_FRAGMENT}
  query GetEvent($id: String!) {
    event(id: $id) {
      ...EventFields
    }
  }
`;

/**
 * Query to fetch user's events (attending)
 */
export const GET_MY_EVENTS = gql`
  ${EVENT_FRAGMENT}
  query GetMyEvents($upcoming: Boolean) {
    myEvents(upcoming: $upcoming) {
      ...EventFields
    }
  }
`;

/**
 * Query to fetch events for the current user's invitations
 * Based on their org memberships and location level
 */
export const GET_EVENTS_FOR_ME = gql`
  ${EVENT_FRAGMENT}
  query GetEventsForMe($limit: Float, $offset: Float) {
    eventsForMe(limit: $limit, offset: $offset) {
      ...EventFields
    }
  }
`;

/**
 * Fragment for event RSVP
 */
export const EVENT_RSVP_FRAGMENT = gql`
  fragment EventRSVPFields on EventRSVPEntity {
    id
    eventId
    userId
    status
    createdAt
  }
`;

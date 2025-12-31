import { gql } from '@apollo/client';
import { EVENT_FRAGMENT, EVENT_RSVP_FRAGMENT } from '../queries/events';

/**
 * Input type for creating an event
 */
export interface CreateEventInput {
  title: string;
  description: string;
  type: string;
  startTime: string;
  endTime?: string;
  location?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  banner?: string;
  orgId?: string;
  maxAttendees?: number;
}

/**
 * Mutation to create an event
 */
export const CREATE_EVENT = gql`
  ${EVENT_FRAGMENT}
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      ...EventFields
    }
  }
`;

/**
 * Mutation to RSVP to an event
 */
export const RSVP_EVENT = gql`
  ${EVENT_RSVP_FRAGMENT}
  mutation RsvpEvent($eventId: String!, $status: String!) {
    rsvpEvent(eventId: $eventId, status: $status) {
      ...EventRSVPFields
    }
  }
`;

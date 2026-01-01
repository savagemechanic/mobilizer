import { gql } from '@apollo/client';

export const MOVEMENT_FRAGMENT = gql`
  fragment MovementFields on MovementEntity {
    id
    name
    slug
    description
    logo
    banner
    themeColor
    isActive
    createdAt
    updatedAt
  }
`;

export const GET_MOVEMENTS = gql`
  ${MOVEMENT_FRAGMENT}
  query GetMovements {
    movements {
      ...MovementFields
    }
  }
`;

export const GET_MOVEMENT = gql`
  ${MOVEMENT_FRAGMENT}
  query GetMovement($id: String!) {
    movement(id: $id) {
      ...MovementFields
    }
  }
`;

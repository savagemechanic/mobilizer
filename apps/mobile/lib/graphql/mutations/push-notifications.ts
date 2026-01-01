import { gql } from '@apollo/client';

export const REGISTER_DEVICE = gql`
  mutation RegisterDevice($input: RegisterDeviceInput!) {
    registerDevice(input: $input) {
      success
      deviceId
      message
    }
  }
`;

export const UNREGISTER_DEVICE = gql`
  mutation UnregisterDevice($input: UnregisterDeviceInput!) {
    unregisterDevice(input: $input)
  }
`;

export const UNREGISTER_ALL_DEVICES = gql`
  mutation UnregisterAllDevices {
    unregisterAllDevices
  }
`;

export const UPDATE_DEVICE_LAST_USED = gql`
  mutation UpdateDeviceLastUsed($token: String!) {
    updateDeviceLastUsed(token: $token)
  }
`;
